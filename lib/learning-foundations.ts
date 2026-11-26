import type { Language } from "./types"

export const mediaSlots = [
  "learning-recognition",
  "learning-emergency-call",
  "learning-compressions",
] as const

export const adultBlsGuidelinesUrl = "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support"

export type FoundationMediaSlot = (typeof mediaSlots)[number]
export type LearningMediaSlot = FoundationMediaSlot
  | "safety-collapse" | "safety-bystander" | "safety-response" | "emergency-dispatch" | "dispatcher-scene"

export const quizChoices = ["fact", "myth"] as const
export type QuizChoice = (typeof quizChoices)[number]

// Keep the response indices used by the existing intro assessment records.
export const quizKeys = [
  { choice: "myth", response: 0 },
  { choice: "myth", response: 1 },
  { choice: "myth", response: 1 },
  { choice: "fact", response: 0 },
] as const

export function quizResponse(index: number, choice: QuizChoice) {
  const key = quizKeys[index]
  return choice === key.choice ? key.response : 1 - key.response
}

type Question = { statement: string; explanation: string }

interface FoundationsCopy {
  stages: [string, string, string]
  back: string
  next: string
  navigation: string
  courseProgress: string
  media: Record<FoundationMediaSlot, string>
  intro: {
    title: [firstLine: string, emphasizedLine: string]
    summary: string
    definitionTitle: string
    definition: string
    recognitionTitle: string
    recognition: [subject: string, response: string, conjunction: string, breathing: string]
    signs: [response: string, breathing: string]
    signsPrompt: string
    signDetails: [response: string, breathing: string]
    sourcesTitle: string
    caresSource: string
    ahaSource: string
  }
  outcomes: Record<FoundationMediaSlot, [title: string, summary: string]>
  outcomesNote: string
  quiz: {
    guidelines: string
    title: string
    question: string
    instructions: string
    correct: string
    incorrect: string
    check: string
    choices: Record<QuizChoice, string>
    questionProgress: string
    feedbackCorrect: string
    feedbackCorrection: string
    complete: string
    closing: string
    continueCourse: string
    review: string
    selected: string
    score: (correct: number, total: number) => string
    questions: [Question, Question, Question, Question]
  }
}

export const foundationsCopy: Record<Language, FoundationsCopy> = {
  ru: {
    stages: ["Почему важно знать СЛР", "Чему ты научишься?", "Мифы о СЛР"],
    back: "Назад", next: "Далее", navigation: "Навигация по модулю",
    courseProgress: "Прогресс курса",
    media: {
      "learning-recognition": "Очевидец проверяет реакцию человека",
      "learning-emergency-call": "Звонок в экстренную службу",
      "learning-compressions": "Тренировочный манекен и метроном",
    },
    intro: {
      title: ["Ты можешь", "помочь близким."],
      summary: "Однажды помощь может понадобиться другу или кому-то из твоих близких. Ты можешь научиться замечать опасность, звать на помощь и начинать СЛР.",
      definitionTitle: "Что такое СЛР?",
      definition: "Сердечно-лёгочная реанимация (СЛР) помогает поддерживать кровообращение до прибытия медицинской помощи.",
      recognitionTitle: "Когда нужна СЛР?",
      recognition: ["Человек", "не реагирует", "и", "не дышит нормально"],
      signs: ["Нет реакции", "Дыхание ненормальное"],
      signsPrompt: "Нажми на признак, чтобы увидеть пример.",
      signDetails: ["Человек не отвечает на обращение и не реагирует на лёгкое похлопывание по плечу.", "Редкие судорожные вздохи тоже относятся к ненормальному дыханию."],
      sourcesTitle: "Научные источники",
      caresSource: "Исследование CARES",
      ahaSource: "Рекомендации AHA, 2025",
    },
    outcomes: {
      "learning-recognition": ["Распознать опасность", "Оценивать обстановку, проверять реакцию и дыхание человека."],
      "learning-emergency-call": ["Вызвать помощь", "Вызвать экстренную помощь и привлечь окружающих."],
      "learning-compressions": ["Начать СЛР", "Освоить положение рук и ритм компрессий."],
    },
    outcomesNote: "Отрабатывай практические навыки на манекене с инструктором.",
    quiz: {
      guidelines: "Рекомендации AHA, 2025",
      title: "Миф или правда?",
      instructions: "Выбери ответ и узнай почему.",
      question: "Вопрос", questionProgress: "Отвечено в викторине",
      correct: "Верно", incorrect: "Неверно", check: "Проверить",
      choices: { fact: "Правда", myth: "Миф" },
      feedbackCorrect: "Верно!", feedbackCorrection: "Правильный ответ",
      complete: "Викторина пройдена",
      closing: "Ты разобрался в четырёх утверждениях о СЛР. Можно идти дальше.",
      continueCourse: "Продолжить курс",
      review: "Разобрать ошибки", selected: "Твой ответ",
      score: (correct, total) => `${correct} из ${total}`,
      questions: [
        { statement: "Помочь при остановке сердца может только врач.", explanation: "Даже без медицинского образования ты можешь вызвать помощь и начать СЛР, следуя указаниям диспетчера." },
        { statement: "Дефибриллятором могут пользоваться только медики.", explanation: "Автоматический наружный дефибриллятор (АНД) сам анализирует сердечный ритм и подсказывает, что делать." },
        { statement: "Инфаркт и остановка сердца — одно и то же.", explanation: "Инфаркт связан с нарушением кровоснабжения сердечной мышцы. При остановке сердца сердце перестаёт эффективно перекачивать кровь." },
        { statement: "Если взрослый не реагирует и не дышит нормально, нужно вызвать экстренную помощь и начать СЛР.", explanation: "Вызови экстренную помощь, начни СЛР и попроси окружающих принести АНД, если он доступен." },
      ],
    },
  },
  en: {
    stages: ["Why CPR matters", "What you’ll learn", "CPR myths"],
    back: "Back", next: "Next", navigation: "Module navigation",
    courseProgress: "Course progress",
    media: {
      "learning-recognition": "A bystander checks whether a person responds",
      "learning-emergency-call": "Calling emergency services",
      "learning-compressions": "A training manikin and a metronome",
    },
    intro: {
      title: ["You can help", "someone you love."],
      summary: "One day, a friend or someone in your family may need help. You can learn to spot an emergency, call for help and start CPR.",
      definitionTitle: "What is CPR?",
      definition: "Cardiopulmonary resuscitation (CPR) helps keep blood circulating until medical help arrives.",
      recognitionTitle: "When is CPR needed?",
      recognition: ["The person is", "unresponsive", "and", "not breathing normally"],
      signs: ["No response", "Abnormal breathing"],
      signsPrompt: "Tap a sign to see an example.",
      signDetails: ["The person doesn’t respond when you speak to them or gently tap their shoulders.", "Occasional gasps also count as abnormal breathing."],
      sourcesTitle: "Scientific sources",
      caresSource: "CARES study",
      ahaSource: "AHA guidelines, 2025",
    },
    outcomes: {
      "learning-recognition": ["Spot an emergency", "Check the surroundings and see whether the person responds and is breathing normally."],
      "learning-emergency-call": ["Call for help", "Call emergency services and ask people nearby to help."],
      "learning-compressions": ["Start CPR", "Learn where to place your hands and how to keep a steady rhythm."],
    },
    outcomesNote: "Practise hands-on skills with a manikin and an instructor.",
    quiz: {
      guidelines: "AHA guidelines, 2025",
      title: "Myth or fact?",
      instructions: "Pick an answer to find out why.",
      question: "Question", questionProgress: "Quiz questions answered",
      correct: "Correct", incorrect: "Incorrect", check: "Check",
      choices: { fact: "Fact", myth: "Myth" },
      feedbackCorrect: "That’s right!", feedbackCorrection: "Correct answer",
      complete: "Quiz complete",
      closing: "You’ve explored four ideas about CPR. You’re ready for the next step.",
      continueCourse: "Continue the course",
      review: "Review missed answers", selected: "Your answer",
      score: (correct, total) => `${correct} out of ${total}`,
      questions: [
        { statement: "Only a doctor can help someone in cardiac arrest.", explanation: "Even without medical training, you can call for help and start CPR by following the dispatcher’s instructions." },
        { statement: "Only medical professionals can use a defibrillator.", explanation: "An automated external defibrillator (AED) checks the heart rhythm and tells you what to do." },
        { statement: "A heart attack and cardiac arrest are the same thing.", explanation: "A heart attack happens when blood flow to the heart muscle is blocked. In cardiac arrest, the heart stops pumping blood effectively." },
        { statement: "If an adult doesn’t respond and isn’t breathing normally, call emergency services and start CPR.", explanation: "Call emergency services, start CPR and ask someone nearby to bring an AED if one is available." },
      ],
    },
  },
  kk: {
    stages: ["ЖӨР-ді білу неге маңызды", "Не үйренесің?", "ЖӨР туралы жаңсақ пікірлер"],
    back: "Артқа", next: "Келесі", navigation: "Модуль бойынша өту",
    courseProgress: "Курстың орындалу барысы",
    media: {
      "learning-recognition": "Куәгер адамның жауап беруін тексеріп жатыр",
      "learning-emergency-call": "Шұғыл қызметке қоңырау шалу",
      "learning-compressions": "Жаттығу манекені мен метроном",
    },
    intro: {
      title: ["Жақын адамыңа", "көмектесе аласың."],
      summary: "Бір күні досыңа немесе отбасыңдағы бір адамға көмек қажет болуы мүмкін. Жағдайды байқап, көмек шақыруды және ЖӨР бастауды үйрене аласың.",
      definitionTitle: "ЖӨР деген не?",
      definition: "Жүрек-өкпе реанимациясы (ЖӨР) медициналық көмек келгенше қан айналымын сақтауға көмектеседі.",
      recognitionTitle: "ЖӨР қашан қажет?",
      recognition: ["Адам", "жауап бермейді", "және", "қалыпты тыныс алмайды"],
      signs: ["Жауап бермейді", "Тынысы қалыпты емес"],
      signsPrompt: "Мысал көру үшін белгіні бас.",
      signDetails: ["Адам дауысыңа да, иығынан жайлап қаққаныңа да жауап бермейді.", "Сирек қырылдап дем алу да қалыпты тынысқа жатпайды."],
      sourcesTitle: "Ғылыми дереккөздер",
      caresSource: "CARES зерттеуі",
      ahaSource: "AHA нұсқаулығы, 2025",
    },
    outcomes: {
      "learning-recognition": ["Қауіпті байқау", "Жағдайды бағалап, адамның жауап беруі мен тынысын тексеру."],
      "learning-emergency-call": ["Көмек шақыру", "Шұғыл қызметке қоңырау шалып, айналадағы адамдардан көмек сұрау."],
      "learning-compressions": ["ЖӨР бастау", "Қолды дұрыс қоюды және кеудені ырғақпен басуды үйрену."],
    },
    outcomesNote: "Практикалық дағдыларды нұсқаушымен бірге манекенде жаттықтыр.",
    quiz: {
      guidelines: "AHA нұсқаулығы, 2025",
      title: "Миф пе, шындық па?",
      instructions: "Жауапты таңда да, себебін біл.",
      question: "Сұрақ", questionProgress: "Жауап берілген сұрақтар",
      correct: "Дұрыс", incorrect: "Қате", check: "Тексеру",
      choices: { fact: "Шындық", myth: "Миф" },
      feedbackCorrect: "Дұрыс!", feedbackCorrection: "Дұрыс жауап",
      complete: "Викторина аяқталды",
      closing: "ЖӨР туралы төрт пікірдің мәнін білдің. Енді келесі сабаққа өте аласың.",
      continueCourse: "Курсты жалғастыру",
      review: "Қателерді талдау", selected: "Сенің жауабың",
      score: (correct, total) => `${total} сұрақ, ${correct} дұрыс жауап`,
      questions: [
        { statement: "Жүрегі тоқтаған адамға тек дәрігер көмектесе алады.", explanation: "Медициналық білімің болмаса да, көмек шақырып, диспетчердің нұсқауымен ЖӨР бастай аласың." },
        { statement: "Дефибрилляторды тек медицина қызметкерлері қолдана алады.", explanation: "Автоматты сыртқы дефибриллятор (АСД) жүрек ырғағын өзі талдап, не істеу керегін айтады." },
        { statement: "Инфаркт пен жүректің тоқтауы — бір нәрсе.", explanation: "Инфаркт кезінде жүрек бұлшықетіне қан жеткізу бұзылады. Жүрек тоқтағанда ол қанды тиімді айдай алмай қалады." },
        { statement: "Ересек адам жауап бермесе және қалыпты тыныс алмаса, шұғыл қызметті шақырып, ЖӨР бастау керек.", explanation: "Шұғыл қызметті шақыр, ЖӨР баста және АСД қолжетімді болса, біреуден оны әкелуді сұра." },
      ],
    },
  },
}
