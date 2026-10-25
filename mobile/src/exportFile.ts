import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
const formats: Record<string, string> = {
  "rebound-visit-summary.html": "text/html",
  "rebound-recovery-journal.json": "application/json",
  "rebound-reminders.ics": "text/calendar",
};
export async function exportWebFile(data: {
  content: string;
  name: string;
  mimeType: string;
  print?: boolean;
}) {
  if (
    !data ||
    typeof data.content !== "string" ||
    data.content.length > 1000000 ||
    formats[data.name] !== data.mimeType?.split(";")[0] ||
    (data.print && data.name !== "rebound-visit-summary.html")
  )
    throw Error("This export format or size is not supported.");
  if (!(await Sharing.isAvailableAsync()))
    throw Error("The iPhone share sheet is unavailable.");
  let file: File | null = null;
  try {
    if (data.print) {
      const result = await Print.printToFileAsync({ html: data.content });
      file = new File(result.uri);
    } else {
      file = new File(Paths.cache, `${Date.now()}-${data.name}`);
      file.create();
      file.write(data.content);
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: data.print ? "application/pdf" : formats[data.name],
      dialogTitle: "Choose where to save or share your Rebound export",
    });
  } finally {
    if (file?.exists) file.delete();
  }
}
