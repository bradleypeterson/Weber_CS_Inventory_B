import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, useQuery, useQueryClient } from "react-query";
import { expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthProvider";
import { useAuth } from "../hooks/useAuth";

vi.mock("../auth/sessionTimeout", () => ({
  sessionActivityEvent: "session-activity",
  watchSessionTimeout: () => () => {}
}));

function mountSession(loadAssets: (token: string) => Promise<string>) {
  localStorage.setItem("token", "first-token");
  localStorage.setItem("personID", "7");
  vi.spyOn(window, "fetch").mockResolvedValue(new Response());
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
