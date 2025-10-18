import type { Context, Filter } from "grammy";

const clearReactions = (ctx: Filter<Context, "message:text">) =>
  ctx.api.setMessageReaction(ctx.msg.chat.id, ctx.msg.message_id, []);

export { clearReactions };
