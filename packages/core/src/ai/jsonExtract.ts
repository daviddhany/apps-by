// Shared by every AIProvider that gets JSON back inside a raw text/chat
// completion (as opposed to a provider-native structured-output mode): pulls
// the JSON out of a fenced ```json ... ``` block if the model wrapped it in
// one, otherwise assumes the whole response is JSON.
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1];
  return text;
}
