import { firebaseAdmin } from "../config/firebase";

export const sendPush = async (
  tokens: string[],
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
) => {
  if (!tokens.length) return;

  await firebaseAdmin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data ?? {},
  });
};
