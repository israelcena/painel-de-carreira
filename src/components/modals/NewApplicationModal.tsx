"use client";

import { useState, useTransition } from "react";
import { createApplication } from "@/app/actions/applications";
import {
  PLATFORM_SUGGESTIONS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  WORK_MODEL_LABELS,
} from "@/lib/domain";
import { dateToInput } from "@/lib/format";
import type { Priority, StageDTO, WorkModel } from "@/lib/types";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { ErrorBox, Field, inputCls } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";

function FormBody({
  stages,
  defaultStageId,
  defaultCountryCode,
  onClose,
}: {
  stages: StageDTO[];
  defaultStageId: string | null;
  defaultCountryCode: string;
  onClose: () => void;
}) {
  const selectableStages = stages.filter((stage) => !stage.isRejection);
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [stageId, setStageId] = useState(
    defaultStageId ?? selectableStages[0]?.id ?? ""
  );
  const [priority, setPriority] = useState<Priority>("MEDIA");
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [platform, setPlatform] = useState("");
  const aplicadoOrder =
    selectableStages.find((s) => s.key === "aplicado")?.order ?? 2;
  const isApplied = (id: string) =>
    (selectableStages.find((s) => s.id === id)?.order ?? 0) >= aplicadoOrder;

  // Interesse ainda não é candidatura: a data só vem preenchida de
  // "Aplicado" em diante, senão o interesse entra na meta da semana.
  const today = dateToInput(new Date());
  const [appliedAt, setAppliedAt] = useState(isApplied(stageId) ? today : "");
  const [workModel, setWorkModel] = useState<WorkModel | "">("");
  const [locationCity, setLocationCity] = useState("");
  const [salary, setSalary] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Acompanha a etapa enquanto a data não foi mexida à mão.
  const changeStage = (next: string) => {
    setStageId(next);
    if (appliedAt === "" || appliedAt === today) {
      setAppliedAt(isApplied(next) ? today : "");
    }
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createApplication({
        company,
        roleTitle,
        stageId,
        priority,
        countryCode,
        platform: platform || null,
        appliedAt: appliedAt || null,
        workModel: workModel || null,
        locationCity: locationCity || null,
        salary: salary || null,
        jobUrl: jobUrl || null,
        applicationUrl: applicationUrl || null,
        jobDescription: jobDescription || null,
        notes: notes || null,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Empresa" htmlFor="nv-company" required>
          <input
            id="nv-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            autoFocus
            placeholder="Ex.: Nubank"
            className={inputCls}
          />
        </Field>
        <Field label="Cargo" htmlFor="nv-role" required>
          <input
            id="nv-role"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
            placeholder="Ex.: Desenvolvedor Sênior"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="País" htmlFor="nv-country" required>
        <CountrySelect
          id="nv-country"
          value={countryCode}
          onChange={setCountryCode}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Etapa" htmlFor="nv-stage">
          <select
            id="nv-stage"
            value={stageId}
            onChange={(e) => changeStage(e.target.value)}
            className={inputCls}
          >
            {selectableStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prioridade" htmlFor="nv-priority">
          <select
            id="nv-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputCls}
          >
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plataforma" htmlFor="nv-platform">
          <input
            id="nv-platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            list="nv-platforms"
            placeholder="LinkedIn, Gupy..."
            className={inputCls}
          />
          <datalist id="nv-platforms">
            {PLATFORM_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Data de aplicação" htmlFor="nv-applied">
          <input
            id="nv-applied"
            type="date"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Modelo de trabalho" htmlFor="nv-model">
          <select
            id="nv-model"
            value={workModel}
            onChange={(e) => setWorkModel(e.target.value as WorkModel | "")}
            className={inputCls}
          >
            <option value="">Não informado</option>
            {(Object.keys(WORK_MODEL_LABELS) as WorkModel[]).map((model) => (
              <option key={model} value={model}>
                {WORK_MODEL_LABELS[model]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cidade" htmlFor="nv-city">
          <input
            id="nv-city"
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
            placeholder="Ex.: São Paulo"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Salário / faixa" htmlFor="nv-salary">
          <input
            id="nv-salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Ex.: R$ 12.000 ou US$ 90k"
            className={inputCls}
          />
        </Field>
        <Field label="Link da vaga" htmlFor="nv-url">
          <input
            id="nv-url"
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://... (anúncio)"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Link da candidatura (opcional)" htmlFor="nv-app-url">
        <input
          id="nv-app-url"
          type="url"
          value={applicationUrl}
          onChange={(e) => setApplicationUrl(e.target.value)}
          placeholder="https://... (página de acompanhamento da candidatura)"
          className={inputCls}
        />
      </Field>

      <Field label="Descrição da vaga" htmlFor="nv-description">
        <textarea
          id="nv-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
          placeholder="Cole aqui o texto completo da vaga: requisitos, responsabilidades, benefícios..."
          className={`${inputCls} resize-y`}
        />
      </Field>

      <Field label="Observações" htmlFor="nv-notes">
        <textarea
          id="nv-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Contatos, requisitos, impressões..."
          className={`${inputCls} resize-y`}
        />
      </Field>

      <ErrorBox message={error} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-brand-violet to-brand-blue py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Adicionar vaga"}
      </button>
    </form>
  );
}

export function NewApplicationModal({
  open,
  stages,
  defaultStageId,
  defaultCountryCode,
  onClose,
}: {
  open: boolean;
  stages: StageDTO[];
  defaultStageId: string | null;
  /** País pré-selecionado ("BR" por padrão; vazio quando a visão Exterior está ativa). */
  defaultCountryCode: string;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Nova vaga" size="lg">
      {/* key força reset do formulário a cada abertura */}
      <FormBody
        key={String(open)}
        stages={stages}
        defaultStageId={defaultStageId}
        defaultCountryCode={defaultCountryCode}
        onClose={onClose}
      />
    </Modal>
  );
}
