import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/styles/style.css";

// This file is the entry point for the Vue application. It creates a Vue App instance, sets up the router and mounts
// the app to the DOM element with the id "app".
//
// Any additional global config or plugins can e added here before mounting the app.

const app = createApp(App);
app.use(router);
app.mount("#app");
