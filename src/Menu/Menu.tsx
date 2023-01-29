import React, {
  ButtonHTMLAttributes,
  Key,
  ReactElement,
  useLayoutEffect,
  useRef
} from "react";
import { AriaMenuProps, MenuTriggerProps } from "@react-types/menu";
import { useMenuTriggerState } from "@react-stately/menu";
import { useTreeState } from "@react-stately/tree";
import { useButton } from "@react-aria/button";
import { FocusScope, useFocusRing } from "@react-aria/focus";
import { useMenu, useMenuItem, useMenuTrigger } from "@react-aria/menu";
import { useOverlayPosition } from "@react-aria/overlays";
import { mergeProps } from "@react-aria/utils";
import { Popover } from "../Popover";
import { useFocusableRef, useUnwrapDOMRef } from "@react-spectrum/utils";
import {
  FocusableRef,
  FocusStrategy,
  DOMRefValue,
  Node
} from "@react-types/shared";
import { TreeState } from "@react-stately/tree";
import styles from "./Menu.module.css";
import clsx from "clsx";
import { useHover } from "@react-aria/interactions";

export type SapphireMenuProps<T extends object> = AriaMenuProps<T> &
  MenuTriggerProps & {
    renderTrigger: (
      props: ButtonHTMLAttributes<Element>,
      isOpen: boolean
    ) => React.ReactNode;
  };

interface MenuItemProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  onAction?: (key: Key) => void;
  onClose: () => void;
  disabledKeys?: Iterable<Key>;
}

export function MenuItem<T>({
  item,
  state,
  onAction,
  disabledKeys,
  onClose
}: MenuItemProps<T>): JSX.Element {
  const ref = React.useRef<HTMLLIElement>(null);
  const isDisabled = disabledKeys && [...disabledKeys].includes(item.key);

  const { menuItemProps } = useMenuItem(
    {
      key: item.key,
      isDisabled,
      onAction,
      onClose
    },
    state,
    ref
  );

  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <li
      {...mergeProps(menuItemProps, hoverProps, focusProps)}
      ref={ref}
      className={clsx(
        styles["sapphire-menu-item"],
        styles["js-focus"],
        styles["js-hover"],
        {
          [styles["is-disabled"]]: isDisabled,
          [styles["is-focus"]]: isFocusVisible,
          [styles["is-hover"]]: isHovered
        }
      )}
    >
      <p className={styles["sapphire-menu-item-overflow"]}>{item.rendered}</p>
    </li>
  );
}

const MenuPopup = <T extends object>(
  props: {
    autoFocus: FocusStrategy;
    onClose: () => void;
  } & SapphireMenuProps<T>
) => {
  const state = useTreeState({ ...props, selectionMode: "none" });
  const menuRef = useRef<HTMLUListElement>(null);
  const { menuProps } = useMenu(props, state, menuRef);

  return (
    <ul {...menuProps} ref={menuRef} className={styles["sapphire-menu"]}>
      {[...state.collection].map((item) => {
        if (item.type === "section") {
          throw new Error("Sections not supported");
        }
        return (
          <MenuItem
            key={item.key}
            item={item}
            state={state}
            onClose={props.onClose}
            onAction={props.onAction}
            disabledKeys={props.disabledKeys}
          />
        );
      })}
    </ul>
  );
};

function _Menu<T extends object>(
  props: SapphireMenuProps<T>,
  ref: FocusableRef<HTMLButtonElement>
) {
  const { renderTrigger, shouldFlip = true } = props;

  const state = useMenuTriggerState(props);
  const triggerRef = useFocusableRef<HTMLButtonElement>(ref);
  const popoverRef = useRef<DOMRefValue<HTMLDivElement>>(null);
  const unwrappedPopoverRef = useUnwrapDOMRef(popoverRef);
  const { menuTriggerProps, menuProps } = useMenuTrigger(
    props,
    state,
    triggerRef
  );
  const { buttonProps } = useButton(menuTriggerProps, triggerRef);

  const { overlayProps, updatePosition } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: unwrappedPopoverRef,
    isOpen: state.isOpen,
    placement: "bottom start",
    offset: 6,
    onClose: state.close,
    shouldFlip
  });
  // Fixes an issue where menu with controlled open state opens in wrong place the first time
  useLayoutEffect(() => {
    if (state.isOpen) {
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [state.isOpen, updatePosition]);

  return (
    <>
      {renderTrigger({ ref: triggerRef, ...buttonProps }, state.isOpen)}
      <Popover
        isOpen={state.isOpen}
        ref={popoverRef}
        style={overlayProps.style}
        className={clsx(styles["sapphire-menu-container"])}
        shouldCloseOnBlur
        onClose={state.close}
      >
        <FocusScope>
          <MenuPopup
            {...mergeProps(props, menuProps)}
            autoFocus={state.focusStrategy || true}
            onClose={state.close}
          />
        </FocusScope>
      </Popover>
    </>
  );
}

export const Menu = React.forwardRef(_Menu) as <T extends object>(
  props: SapphireMenuProps<T>,
  ref: FocusableRef<HTMLButtonElement>
) => ReactElement;
