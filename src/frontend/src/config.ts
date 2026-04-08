import {
  createActorWithConfig as _createActorWithConfig,
  type CreateActorOptions,
} from "@caffeineai/core-infrastructure";
import { createActor } from "./backend";

export type { CreateActorOptions };

// Wrapper that pre-binds the app's createActor function
// biome-ignore lint/suspicious/noExplicitAny: dynamic actor return type
export async function createActorWithConfig(options?: CreateActorOptions): Promise<any> {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic actor
  return _createActorWithConfig(createActor as any, options);
}
