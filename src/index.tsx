import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Menu, Item } from "./Menu";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <Menu
      renderTrigger={(props) => <button {...props}>Actions</button>}
      onAction={alert}
    >
      <Item key="copy">Copy application</Item>
      <Item key="rename">Rename application</Item>
      <Item key="move" title="Move to">
        <Item key="move-to-shared">Shared</Item>
        <Item key="move-to-desktop">Desktop</Item>
        <Item key="move-to-favorite">Favorite</Item>
      </Item>
      <Item key="delete">Delete application</Item>
    </Menu>
  </StrictMode>
);
