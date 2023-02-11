import React from "react";
import "../../Styles/editor.css";
import {
  BoldExtension,
  ItalicExtension,
  UnderlineExtension,
  StrikeExtension,
  OrderedListExtension,
  BulletListExtension,
} from "remirror/extensions";
import { CountExtension } from "@remirror/extension-count";
import {
  useRemirror,
  ComponentItem,
  Remirror,
  Toolbar,
  ThemeProvider,
  useHelpers,
} from "@remirror/react";
import type { ToolbarItemUnion } from "@remirror/react";

const charLimit: number = 800;

const Counter = ({
  max,
  setEditorContent,
}: {
  max: number;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { getCharacterCount, isCountValid, getHTML } = useHelpers(true);
  const count = getCharacterCount();
  const remaining = max - count;

  React.useEffect(() => {
    setEditorContent(
      (getHTML() as string).slice(0, 900).replaceAll("<p></p>", "")
    );
  }, [getHTML()]);

  if (!isCountValid()) {
    return <p style={{ color: "red", order: 2 }}>{remaining}</p>;
  }

  return <></>;
};

const extensions = () => [
  new BoldExtension({}),
  new ItalicExtension(),
  new UnderlineExtension(),
  new CountExtension({ maximum: charLimit }),
  new StrikeExtension(),
  new BulletListExtension(),
  new OrderedListExtension(),
];

const toolbarItems: ToolbarItemUnion[] = [
  {
    type: ComponentItem.ToolbarGroup,
    label: "History",
    items: [
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "undo",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "redo",
        display: "icon",
      },
    ],
  },
  {
    type: ComponentItem.ToolbarGroup,
    label: "Simple Formatting",
    items: [
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleBold",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleItalic",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleUnderline",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleStrike",
        display: "icon",
      },
    ],
  },
  {
    type: ComponentItem.ToolbarGroup,
    label: "List",
    items: [
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleBulletList",
        display: "icon",
      },
      {
        type: ComponentItem.ToolbarCommandButton,
        commandName: "toggleOrderedList",
        display: "icon",
      },
    ],
  },
];

export default function Editor({
  editorContent,
  setEditorContent,
}: {
  editorContent: string;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { manager, state } = useRemirror({
    extensions,
    content: editorContent,
    selection: "end",
    stringHandler: "html",
  });
  return (
    <ThemeProvider>
      <Remirror manager={manager} initialContent={state} autoRender="end">
        <Toolbar items={toolbarItems} refocusEditor label="Top Toolbar" />
        <Counter max={charLimit} setEditorContent={setEditorContent} />
      </Remirror>
    </ThemeProvider>
  );
}
