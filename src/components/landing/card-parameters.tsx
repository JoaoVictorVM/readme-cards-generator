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
    <section
      aria-labelledby="parameters"
      className="flex scroll-mt-24 flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="parameters"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {landing.parametersTitle}
        </h2>
        <p className="max-w-2xl text-muted">{landing.parametersIntro}</p>
      </div>
      <div className="overflow-x-auto border-t">
        <table
          aria-labelledby="parameters"
          className="w-full min-w-[32rem] text-left text-sm"
        >
          <thead className="border-b font-mono text-xs tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="py-3 pr-4 font-medium">
                {landing.parameterNameHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {landing.parameterValuesHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {landing.parameterDefaultHeader}
              </th>
              <th scope="col" className="py-3 pl-4 font-medium">
                {landing.parameterDescriptionHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b last:border-b-0">
                <th scope="row" className="py-4 pr-4 font-mono font-medium">
                  {row.name}
                </th>
                <td className="px-4 py-4 font-mono text-muted">
                  {row.values.join(", ")}
                </td>
                <td className="px-4 py-4 font-mono">{row.defaultValue}</td>
                <td className="py-4 pl-4 text-muted">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-wide text-muted uppercase">
          {landing.exampleUrlLabel}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <code className="block min-w-0 flex-1 rounded-site border bg-surface px-4 py-3 font-mono text-sm leading-relaxed break-all select-all">
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
