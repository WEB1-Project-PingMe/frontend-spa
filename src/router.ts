import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("/", "./App.tsx"),
  route("login", "./component/login.tsx"),
  route("chats", "./component/chat-layout.tsx"),
  route("chats/:uuid", "./component/chat-layout.tsx"),
  route("explore", "./component/chat-layout.tsx"),
  route("explore/:name", "./component/explore.tsx"),
] satisfies RouteConfig;
