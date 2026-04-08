import { useActor as useActorBase } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

// biome-ignore lint/suspicious/noExplicitAny: backend actor needs dynamic methods
type AnyActor = any;

let _actor: AnyActor | null = null;
let _isFetching = false;

// Wrap the infrastructure useActor with the app's createActor bound in
export function useActor(): { actor: AnyActor | null; isFetching: boolean } {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic actor
  const result = useActorBase(createActor as any);
  return result as { actor: AnyActor | null; isFetching: boolean };
}
