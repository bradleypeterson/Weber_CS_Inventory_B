import { useData } from "../hooks/useData";

export function Test() {
  const { data, loading } = useData("testData", fetchFakeData);

  console.log(data, loading);
  if (loading || data === undefined) return <></>;
  return <>{data.userId}</>;
}

type Response = {
  userId: string;
};

async function fetchFakeData(): Promise<Response> {
  return fetch("https://jsonplaceholder.typicode.com/todos/1")
    .then((response) => response.json())
    .then((json) => json);
}
