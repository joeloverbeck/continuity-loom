import { RecordEditor, type RecordEditorProps } from "./RecordEditor.js";

type CastMemberEditorProps = Omit<RecordEditorProps, "recordType">;

export function CastMemberEditor(props: CastMemberEditorProps): React.JSX.Element {
  return <RecordEditor {...props} recordType="CAST MEMBER" />;
}
