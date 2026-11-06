import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, useQuery, useQueryClient } from "react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { get, validateEmptyResponse } from "../api/helpers";
import { AuthProvider } from "../context/AuthProvider";
import { useAuth } from "../hooks/useAuth";

vi.mock("../auth/sessionTimeout", () => ({
  sessionActivityEvent: "session-activity",
  watchSessionTimeout: () => () => {}
}));

beforeEach(() => {
  vi.spyOn(window, "fetch").mockResolvedValue(new Response());
});

function mountSession(loadAssets: (token: string) => Promise<string>) {
  localStorage.setItem("token", "first-token");
  localStorage.setItem("personID", "7");
  const clients = new Map<string, QueryClient>();

  function Session() {
    const { logout, setToken, token } = useAuth();
    const client = useQueryClient();
    const { data } = useQuery("AssetsList", () => loadAssets(token), { enabled: Boolean(token) });
    clients.set(token, client);
    if (!token) {
      return <button onClick={() => {
        localStorage.setItem("token", "second-token");
        setToken("second-token");
      }}>Sign in as second user</button>;
    }
    return <>
      <button onClick={logout}>Log out</button>
      <output>{data ?? "Loading assets"}</output>
    </>;
  }

  render(<AuthProvider><Session /></AuthProvider>);
  return clients;
}

it("clears the query and mutation caches before another account signs in", async () => {
  let finishSecond!: (value: string) => void;
  const clients = mountSession((token) => token === "first-token"
    ? Promise.resolve("First user's asset")
    : new Promise(resolve => { finishSecond = resolve; }));
  await screen.findByText("First user's asset");
  const previous = clients.get("first-token")!;
  previous.getMutationCache().build(previous, { mutationFn: async () => "first user" });
  expect(previous.getMutationCache().getAll()).toHaveLength(1);

  fireEvent.click(screen.getByText("Log out"));
  expect(previous.getQueryCache().getAll()).toHaveLength(0);
  expect(previous.getMutationCache().getAll()).toHaveLength(0);
  fireEvent.click(screen.getByText("Sign in as second user"));
  expect(clients.get("second-token")).not.toBe(previous);
  expect(screen.queryByText("First user's asset")).toBeNull();
  await act(async () => finishSecond("Second user's asset"));
  await screen.findByText("Second user's asset");
});

it("ignores a pending query and isolates late callbacks after logout in another tab", async () => {
  let finishFirst!: (value: string) => void;
  const loadAssets = vi.fn((token: string) => token === "first-token"
    ? new Promise<string>(resolve => { finishFirst = resolve; })
    : Promise.resolve("Second user's asset"));
  const clients = mountSession(loadAssets);
  await waitFor(() => expect(loadAssets).toHaveBeenCalledWith("first-token"));
  const previous = clients.get("first-token")!;

  act(() => {
    localStorage.removeItem("token");
    window.dispatchEvent(new StorageEvent("storage", { key: "token", storageArea: localStorage }));
  });
  expect(previous.getQueryCache().getAll()).toHaveLength(0);
  fireEvent.click(screen.getByText("Sign in as second user"));
  await screen.findByText("Second user's asset");

  await act(async () => finishFirst("First user's late asset"));
  expect(previous.getQueryData("AssetsList")).toBeUndefined();
  act(() => previous.setQueryData("AssetsList", "Late callback for first user"));
  expect(clients.get("second-token")!.getQueryData("AssetsList")).toBe("Second user's asset");
  expect(screen.queryByText(/First user's late asset|Late callback/)).toBeNull();
});

it("aborts the previous session's API requests while keeping the server logout request alive", async () => {
  let finishFirst!: (response: Response) => void;
  let firstRequest!: ReturnType<typeof get>;
  const fetchMock = vi.mocked(window.fetch);
  fetchMock.mockImplementation(async (url, options) => {
    if (String(url).endsWith("/auth/logout")) return new Response(null, { status: 204 });
    if (new Headers(options?.headers).get("Authorization") === "Bearer second-token") {
      return Response.json({ status: "success", data: { asset: "Second user's asset" } });
    }
    return new Promise(resolve => { finishFirst = resolve; });
  });
  mountSession(async (token) => {
    const request = get("/assets/list", validateEmptyResponse);
    if (token === "first-token") firstRequest = request;
    const result = await request;
    if (result.status === "error") throw new Error(result.error.message);
    return String(result.data.asset);
  });
  await waitFor(() => expect(firstRequest).toBeDefined());
  const firstOptions = fetchMock.mock.calls[0][1]!;
  expect(firstOptions.cache).toBe("no-store");
  expect(firstOptions.signal?.aborted).toBe(false);

  fireEvent.click(screen.getByText("Log out"));
  expect(firstOptions.signal?.aborted).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/logout$/), expect.objectContaining({
    keepalive: true,
    headers: { Authorization: "Bearer first-token" }
  }));
  fireEvent.click(screen.getByText("Sign in as second user"));
  await screen.findByText("Second user's asset");
  await act(async () => finishFirst(new Response("Old response", { status: 401 })));
  await expect(firstRequest).resolves.toEqual({ status: "error", error: { message: "The session has ended." } });
  expect(screen.getByText("Second user's asset")).toBeTruthy();
});
