import { getAuth } from "@pfmp/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(getAuth());

export const GET = handler.GET;
export const POST = handler.POST;
