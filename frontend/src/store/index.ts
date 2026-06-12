import { configureStore } from "@reduxjs/toolkit";

import appReducer from "./slices/app-slice";
import authReducer from "./slices/auth-slice";
import uiReducer from "./slices/ui-slice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      app: appReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
