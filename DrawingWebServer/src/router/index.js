import { createRouter, createWebHistory } from "vue-router";
import DrawingView from "../views/DrawingView.vue";

// This file sets up the Vue Router for the application. It defines the routes and their corresponding components.
// The router is then exported for use in the main application file (src/main.js).
//

const routes = [
  {
    path: "/",
    name: "drawing",
    component: DrawingView,
  },
];

// Create the router instance and pass the `routes` option
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Export the router instance to be used in the main application file
export default router;
