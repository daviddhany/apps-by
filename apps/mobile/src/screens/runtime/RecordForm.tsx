import { useState } from "react";
import { View, Text, TextInput, Pressable, Switch, ActivityIndicator } from "react-native";
import type { FieldDef } from "@needly/core";
import { Icon } from "../../components/Icon";

interface Props {
  fields: FieldDef[];
  submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function RecordForm({ fields, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const f of fields) if (f.default !== undefined) initial[f.key] = f.default;
    return initial;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-3">
      {fields
        .filter((f) => f.key !== "createdAt" && !["image", "location", "rating", "status"].includes(f.type))
        .map((field) => (
          <FieldInput key={field.key} field={field} value={values[field.key]} onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))} />
        ))}
      {error ? <Text className="text-sm text-error">{error}</Text> : null}
      <View className="mt-1 flex-row gap-2">
        <Pressable onPress={onCancel} className="flex-1 items-center rounded-full border border-outline-variant/40 py-3">
          <Text className="font-semibold text-on-surface-variant">Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSubmit} disabled={busy} className="flex-1 items-center rounded-full bg-primary py-3 disabled:opacity-50">
          {busy ? <ActivityIndicator color="#1000a9" /> : <Text className="font-semibold text-on-primary">{submitLabel}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (field.type === "boolean") {
    return (
      <View className="flex-row items-center justify-between rounded-2xl bg-surface-container-low px-3.5 py-3">
        <Text className="text-sm text-on-surface">{field.label}</Text>
        <Switch value={Boolean(value)} onValueChange={onChange} />
      </View>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <View className="gap-1.5">
        <Text className="text-xs text-on-surface-variant">{field.label}</Text>
        <View className="flex-row flex-wrap gap-2">
          {field.options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={`rounded-full px-3 py-1.5 ${value === opt ? "bg-primary" : "bg-surface-container-low"}`}
            >
              <Text className={value === opt ? "text-sm font-medium text-on-primary" : "text-sm text-on-surface"}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (field.type === "multiselect") {
    return <ChipListInput label={field.label} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
  }

  if (field.type === "person") {
    return (
      <View className="gap-1.5">
        <Text className="text-xs text-on-surface-variant">{field.label}</Text>
        <TextInput
          placeholder="Name"
          placeholderTextColor="#908fa0"
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
        />
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-xs text-on-surface-variant">{field.label}</Text>
      <TextInput
        keyboardType={field.type === "number" || field.type === "money" ? "numeric" : "default"}
        value={value === undefined || value === null ? "" : String(value)}
        onChangeText={(text) => onChange(field.type === "number" || field.type === "money" ? Number(text) : text)}
        className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
      />
    </View>
  );
}

/** "Add <name>" chip entry, one at a time, instead of a fiddly
 * comma-separated text box — used for voting options, split-among names,
 * passenger lists, etc. */
function ChipListInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <View className="gap-1.5">
      <Text className="text-xs text-on-surface-variant">{label}</Text>
      <View className="flex-row gap-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          returnKeyType="done"
          placeholder="Type a name, then tap Add"
          placeholderTextColor="#908fa0"
          className="flex-1 rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
        />
        <Pressable onPress={commit} className="items-center justify-center rounded-2xl bg-surface-container-high px-4">
          <Text className="font-semibold text-on-surface">Add</Text>
        </Pressable>
      </View>
      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {value.map((item) => (
            <View key={item} className="flex-row items-center gap-1.5 rounded-full bg-primary-fixed py-1 pl-3 pr-1.5">
              <Text className="text-sm text-on-primary-fixed">{item}</Text>
              <Pressable onPress={() => onChange(value.filter((v) => v !== item))} className="h-4 w-4 items-center justify-center rounded-full">
                <Icon name="close" size={12} color="#07006c" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
