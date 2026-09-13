import { CopyExampleUrl } from "@/components/landing/copy-example-url";
import { PARAMETER_ROWS } from "@/components/landing/example-url";
import { format } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/types";

type CardParametersProps = {
  dictionary: Dictionary;
  exampleUrl: string;
};

export function CardParameters({
  dictionary,
  exampleUrl,
}: CardParametersProps) {
  const { landing } = dictionary;
  const { theme, locale, width } = PARAMETER_ROWS;
  const rows = [
    { ...theme, description: landing.themeDescription },
    { ...locale, description: landing.localeDescription },
    {
      ...width,
      description: format(landing.widthDescription, {
        min: width.min,
        max: width.max,
      }),
    },
  ];

  return (
    <section aria-labelledby="parameters" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id="parameters" className="text-2xl font-semibold tracking-tight">
          {landing.parametersTitle}
        </h2>
        <p className="max-w-2xl text-[var(--color-muted)]">
          {landing.parametersIntro}
        </p>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-site)] border border-[var(--color-border)]">
        <table
          aria-labelledby="parameters"
          className="w-full min-w-[32rem] text-left text-sm"
        >
          <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                {landing.parameterNameHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {landing.parameterValuesHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {landing.parameterDefaultHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {landing.parameterDescriptionHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name}
                className="border-b border-[var(--color-border)] last:border-b-0"
              >
                <th scope="row" className="px-4 py-3 font-mono font-medium">
                  {row.name}
                </th>
                <td className="px-4 py-3 font-mono">{row.values.join(", ")}</td>
                <td className="px-4 py-3 font-mono">{row.defaultValue}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{landing.exampleUrlLabel}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <code className="block min-w-0 flex-1 rounded-[var(--radius-site)] border border-[var(--color-border)] px-4 py-3 font-mono text-sm break-all select-all">
            {exampleUrl}
          </code>
          <CopyExampleUrl
            url={exampleUrl}
            copyLabel={landing.copyExampleLabel}
            copiedLabel={landing.copiedExampleLabel}
          />
        </div>
      </div>
    </section>
  );
}
