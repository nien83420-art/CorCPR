import { completeDispatcherAnswer, dispatcherAnswers, type DispatcherAnswer } from "@/lib/dispatcher-draft"
import type { scenarioCopy } from "@/lib/learning-scenarios"

export function DispatcherAnswerChoices({ report, answer, onAnswer }: {
  report: (typeof scenarioCopy)["en"]["call"]["report"]
  answer: DispatcherAnswer | null
  onAnswer: (answer: DispatcherAnswer) => void
}) {
  return <div role="group" aria-labelledby="dispatcher-opening-question" className="ml-auto grid w-full max-w-[95%] gap-1.5">
    {dispatcherAnswers.map(index => {
      const selected = answer === index
      return <button key={index} type="button" aria-pressed={selected} aria-disabled={answer === completeDispatcherAnswer}
        onClick={() => onAnswer(index)}
        className={`flex min-h-11 items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm leading-snug focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 ${
          selected ? "border-red-700 bg-red-50 text-zinc-950" : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
        }`}>
        <span aria-hidden="true" className="min-w-4 font-semibold text-red-800">{["A", "B", "C"][index]}</span>
        <span>{report.options[index]}</span>
      </button>
    })}
  </div>
}
