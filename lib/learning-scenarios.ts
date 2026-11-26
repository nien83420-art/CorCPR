import { selfAssessmentCopy } from "./course-self-assessment"
import type { Language } from "./types"

interface Decision {
  prompt: string
  options: readonly string[]
  correct: number
  feedback: readonly string[]
}

export type SafetyChoice = 0 | 1
export const safeRoadwayChoice = 1

export type SafetyDecisionEvidence = {
  firstChoice: SafetyChoice
  attempts: 1 | 2
  finalChoice: typeof safeRoadwayChoice
  firstChoiceAt: number
  completedAt: number
}

interface ScenarioCopy {
  stages: [string, string, string]
  home: string
  step: string
  safety: {
    parts: [[title: string, text: string, media: string], [title: string, text: string, media: string], [title: string, text: string, media: string]]
    hazards: [traffic: string, electricity: string, fire: string, falling: string]
    decision: Omit<Decision, "correct" | "options" | "feedback"> & {
      options: [unsafe: string, safe: string]
      feedback: [unsafe: string, safe: string]
    }
    ruleTitle: string
    rule: string
    continue: string
    progress: string
    approach: [string, string, string]
    speakClearly: string
    spokenCheck: string
    responds: string
    unresponsive: string
    request: string
    aed: string
    alone: string
  }
  call: {
    simulation: string
    practice: {
      heading: string
      introduction: string
      task: string
      notice: string
      number: string
      dial: string
      erase: string
      retry: string
      retryHelp: string
      success: string
      successHelp: string
      proceed: string
      progress: string
      source: string
    }
    report: {
      prompt: string
      options: [vague: string, complete: string, assumption: string]
      /** Existing locale-specific response ID used by saved course evidence. */
      correct: number
      context: string
      accepted: string
      retry: string
      continue: string
    }
    conversation: {
      dispatcher: string
      missingNumber: string
      urgent: string
      instructions: [string, string, string, string]
      actions: [string, string, string]
      confirmations: [string, string, string]
      knownFinding: string
      yourAction: string
      speak: string
      phrase: string
      caution: string
      startCpr: string
      guidelines: string
    }
  }
}

export const scenarioCopy: Record<Language, ScenarioCopy> = {
  ru: {
    stages: [selfAssessmentCopy.ru.title, "Этап 1. Безопасность", "Этап 2. Вызов экстренной помощи"],
    home: "CorCpr — на главную", step: "Шаг",
    safety: {
      parts: [
        ["Вы замечаете человека на дороге", "Мужчина лежит неподвижно на проезжей части. Рядом продолжают ехать машины.", "Мужчина на проезжей части"],
        ["Движение остановлено", "Сотрудники полиции перекрыли движение у главного входа в общественный центр «Ясный берег» на площади Маячного Света. Машины остановлены, участок ограждён. Теперь можно безопасно подойти к мужчине.", "Иллюстрация: обращение к человеку и лёгкое касание плеч"],
        ["Обратитесь к конкретному очевидцу", "Мужчина по-прежнему не реагирует. Если скорую ещё не вызвали, поручите это очевидцу. Сразу проверьте, дышит ли мужчина нормально.", "Иллюстрация: обращение за помощью к очевидцу"],
      ],
      hazards: ["Движущийся транспорт", "Электричество", "Огонь и газ", "Падающие предметы"],
      decision: {
        prompt: "Что вы сделаете?",
        options: ["Сразу подойду к человеку.", "Останусь в безопасном месте и вызову помощь."],
        feedback: ["Это опасно. Движущийся транспорт представляет угрозу и для вас. Оставайтесь в безопасном месте и вызовите экстренную помощь.", "Верно. Не выходите на проезжую часть, пока это небезопасно. Вызовите экстренную помощь из безопасного места."],
      },
      ruleTitle: "Главное правило",
      rule: "Прежде чем подойти к пострадавшему, убедитесь в собственной безопасности.",
      continue: "Продолжить",
      progress: "Шаги этапа безопасности",
      approach: ["Подойдите к человеку.", "Встаньте рядом на колени.", "Осторожно постучите по его плечам."],
      speakClearly: "Громко и чётко спросите:",
      spokenCheck: "Мужчина! Что с вами? Вы меня слышите?",
      responds: "Если человек отвечает, оцените его состояние и действуйте по ситуации. При необходимости вызовите экстренную помощь и следуйте указаниям диспетчера.",
      unresponsive: "Если мужчина не реагирует, сразу организуйте вызов экстренной помощи, если его ещё не сделали. Не откладывайте проверку дыхания.",
      request: "Девушка в зелёной куртке! Вызовите скорую помощь!",
      aed: "Попросите второго очевидца принести автоматический наружный дефибриллятор (АНД), если он доступен.",
      alone: "Если рядом никого нет и вызов ещё не сделан, позвоните сами. По возможности включите громкую связь.",
    },
    call: {
      simulation: "Учебная симуляция. Настоящий вызов не выполняется.",
      practice: {
        heading: "Вызов экстренной помощи",
        introduction: "Вы уже знаете, когда необходимо вызвать помощь. Теперь отработайте звонок в экстренную службу.",
        task: "Наберите номер экстренной службы в Казахстане.",
        notice: "Это симуляция. Реальный звонок не совершается.",
        number: "Набранный номер", dial: "Учебный звонок", erase: "Удалить последнюю цифру",
        retry: "Попробуйте ещё раз.",
        retryHelp: "В Казахстане можно вызвать скорую помощь по номеру 103 или обратиться в единую экстренную службу по номеру 112.",
        success: "Верный номер",
        successHelp: "103 — скорая медицинская помощь. 112 — единая экстренная служба.",
        proceed: "Продолжить", progress: "Шаги этапа вызова экстренной помощи",
        source: "Экстренные номера Казахстана — официальный источник",
      },
      report: {
        prompt: "Где вы находитесь и что произошло?",
        context: "У главного входа в общественный центр «Ясный берег» (площадь Маячного Света, 18) упал мужчина. Он не реагирует и не дышит нормально. Адрес вымышлен.",
        options: [
          "Рядом со мной мужчина, ему стало плохо. Пожалуйста, отправьте помощь.",
          "Я у главного входа в общественный центр «Ясный берег», площадь Маячного Света, 18. Мужчина не реагирует и не дышит нормально.",
          "Я возле центра «Ясный берег». Мужчина упал, возможно, у него инфаркт.",
        ],
        correct: 1,
        accepted: "Верно. Вы сообщили местоположение и важные сведения о состоянии человека.",
        retry: "Диспетчеру важно знать точное местоположение и что происходит с человеком. Попробуйте ответить ещё раз.",
        continue: "Продолжить разговор",
      },
      conversation: {
        dispatcher: "Диспетчер", missingNumber: "Номер не сохранён",
        urgent: "Во время реальной остановки сердца начинайте компрессии без задержки, как только помощь вызвана.",
        instructions: [
          "Включите громкую связь и положите телефон рядом с собой, чтобы ваши руки оставались свободными.",
          "Убедитесь, что пострадавший лежит на спине на твёрдой ровной поверхности, если это можно сделать безопасно и без задержки.",
          "Подтвердите результат проверки дыхания. Редкие судорожные вздохи не считаются нормальным дыханием.",
          "Начинайте сердечно-лёгочную реанимацию. Я буду подсказывать вам дальнейшие действия.",
        ],
        actions: ["Включить громкую связь", "Положение проверено", "Нормального дыхания нет"],
        confirmations: ["Громкая связь включена в симуляции.", "Положение проверено.", "Подтверждено: нормального дыхания нет."],
        knownFinding: "Вы уже проверили дыхание. Мужчина не реагирует и не дышит нормально.",
        yourAction: "Ваше действие", speak: "Громко и чётко произнесите:", phrase: "Начинаю алгоритм СЛР!",
        caution: "Эта фраза используется в учебном задании. В реальной ситуации она необязательна. Начинайте компрессии без задержки.",
        startCpr: "Начать СЛР", guidelines: "Рекомендации AHA, 2025",
      },
    },
  },
  en: {
    stages: [selfAssessmentCopy.en.title, "Stage 1. Safety", "Stage 2. Calling for emergency help"],
    home: "CorCpr — home", step: "Step",
    safety: {
      parts: [
        ["You spot someone on the road", "A man lies motionless in the roadway. Cars are still passing nearby.", "A man in the roadway"],
        ["Traffic has stopped", "Police have closed the road by the main entrance to the Clearshore Community Centre on Beaconlight Square. Traffic has stopped and the area is cordoned off. You can now safely approach the man.", "Illustration: Speaking to the person and gently tapping his shoulders"],
        ["Ask a specific bystander for help", "The man still doesn’t respond. If no one has called emergency services yet, ask a bystander to call. Check for normal breathing without delay.", "Illustration: Asking a bystander to help"],
      ],
      hazards: ["Moving traffic", "Electricity", "Fire and gas", "Falling objects"],
      decision: {
        prompt: "What will you do?",
        options: ["I’ll approach the man right away.", "I’ll stay somewhere safe and call for help."],
        feedback: ["That’s dangerous. Moving traffic puts you at risk too. Stay somewhere safe and call emergency services.", "That’s right. Stay off the road while it’s unsafe. Call emergency services from a safe place."],
      },
      ruleTitle: "The key rule",
      rule: "Make sure it’s safe for you before you approach the person.",
      continue: "Continue",
      progress: "Safety steps",
      approach: ["Approach the person.", "Kneel beside him.", "Gently tap his shoulders."],
      speakClearly: "Speak loudly and clearly:",
      spokenCheck: "Sir! Are you all right? Can you hear me?",
      responds: "If the person responds, assess their condition and act accordingly. Call emergency services if needed and follow the dispatcher’s instructions.",
      unresponsive: "If the man doesn’t respond and no one has called emergency services yet, arrange a call right away. Check for normal breathing without delay.",
      request: "You in the green jacket! Call an ambulance!",
      aed: "Ask a second bystander to bring an automated external defibrillator (AED) if one is available.",
      alone: "If no one is nearby and no one has called yet, call emergency services yourself. Use speakerphone if you can.",
    },
    call: {
      simulation: "Training simulation. No real call is made.",
      practice: {
        heading: "Calling for emergency help",
        introduction: "You already know when to call for help. Now practise calling emergency services.",
        task: "Dial an emergency number in Kazakhstan.",
        notice: "This is a simulation. No real call is made.",
        number: "Number entered", dial: "Practice call", erase: "Delete the last digit",
        retry: "Try again.",
        retryHelp: "In Kazakhstan, dial 103 for an ambulance or 112 for the unified emergency service.",
        success: "Correct number",
        successHelp: "103 is for ambulance services. 112 is the unified emergency number.",
        proceed: "Continue", progress: "Emergency call stage progress",
        source: "Official emergency numbers for Kazakhstan",
      },
      report: {
        prompt: "Where are you, and what happened?",
        context: "A man collapsed at the main entrance to the Clearshore Community Centre, 18 Beaconlight Square. He isn’t responding or breathing normally. The address is fictional.",
        options: [
          "There’s a man here who’s collapsed. Please send help.",
          "I’m at the main entrance to the Clearshore Community Centre, 18 Beaconlight Square. A man isn’t responding or breathing normally.",
          "I’m near the Clearshore Community Centre. A man has collapsed. He may have had a heart attack.",
        ],
        correct: 2,
        accepted: "Correct. You gave the location and shared important information about the person’s condition.",
        retry: "The dispatcher needs to know the exact location and what’s happening to the person. Try again.",
        continue: "Continue the conversation",
      },
      conversation: {
        dispatcher: "Dispatcher", missingNumber: "Number unavailable",
        urgent: "In a real cardiac arrest, start compressions without delay once help has been called.",
        instructions: [
          "Put your phone on speaker and set it beside you so both hands are free.",
          "Make sure the person is lying on their back on a firm, flat surface if you can do so safely and without delay.",
          "Confirm what you observed when you checked breathing. Occasional gasps do not count as normal breathing.",
          "Start cardiopulmonary resuscitation. I’ll guide you through what to do next.",
        ],
        actions: ["Turn on speakerphone", "Position checked", "No normal breathing"],
        confirmations: ["Speakerphone enabled in the simulation.", "Position checked.", "No normal breathing confirmed."],
        knownFinding: "You’ve already checked the man’s breathing. He isn’t responding or breathing normally.",
        yourAction: "Your action", speak: "Say this clearly and aloud:", phrase: "I’m starting the CPR steps!",
        caution: "This phrase is part of the exercise. In a real emergency it’s optional. Start compressions without delay.",
        startCpr: "Start CPR", guidelines: "AHA guidelines, 2025",
      },
    },
  },
  kk: {
    stages: [selfAssessmentCopy.kk.title, "1-кезең. Қауіпсіздік", "2-кезең. Шұғыл көмек шақыру"],
    home: "CorCpr — басты бетке", step: "Қадам",
    safety: {
      parts: [
        ["Жолда жатқан адамды байқадыңыз", "Ер адам жолдың көлік жүретін бөлігінде қимылсыз жатыр. Жанынан көліктер әлі өтіп жатыр.", "Жолдың көлік жүретін бөлігінде жатқан ер адам"],
        ["Көлік қозғалысы тоқтады", "Полиция Маяк нұры алаңындағы «Ашық жағалау» қоғамдық орталығының негізгі кіреберісі маңында жолды жапты. Көлік қозғалысы тоқтады, аумақ қоршалды. Енді ер адамға қауіпсіз жақындай аласыз.", "Иллюстрация: адамға тіл қатып, иығын ақырын қағу"],
        ["Нақты бір куәгерден көмек сұраңыз", "Ер адам әлі жауап бермейді. Жедел жәрдем әлі шақырылмаса, куәгерден қоңырау шалуын сұраңыз. Ер адамның қалыпты тыныс алып жатқанын дереу тексеріңіз.", "Иллюстрация: куәгерден көмек сұрау"],
      ],
      hazards: ["Қозғалыстағы көліктер", "Электр тогы", "От пен газ", "Құлайтын заттар"],
      decision: {
        prompt: "Не істейсіз?",
        options: ["Адамға бірден жақындаймын.", "Қауіпсіз жерде қалып, көмек шақырамын."],
        feedback: ["Бұл қауіпті. Қозғалыстағы көліктер сізге де қауіп төндіреді. Қауіпсіз жерде қалып, шұғыл қызметті шақырыңыз.", "Дұрыс. Қауіп сейілмейінше жолдың көлік жүретін бөлігіне шықпаңыз. Шұғыл қызметті қауіпсіз жерден шақырыңыз."],
      },
      ruleTitle: "Басты ереже",
      rule: "Зардап шеккен адамға жақындамас бұрын өз қауіпсіздігіңізге көз жеткізіңіз.",
      continue: "Жалғастыру",
      progress: "Қауіпсіздік кезеңінің қадамдары",
      approach: ["Адамға жақындаңыз.", "Жанына тізерлеңіз.", "Иықтарын ақырын қағыңыз."],
      speakClearly: "Дауыстап, анық сұраңыз:",
      spokenCheck: "Аға! Сізге не болды? Мені естіп тұрсыз ба?",
      responds: "Адам жауап берсе, жағдайын бағалап, соған сай әрекет етіңіз. Қажет болса, шұғыл қызметке хабарласып, диспетчердің нұсқауын орындаңыз.",
      unresponsive: "Ер адам жауап бермесе және шұғыл қызмет әлі шақырылмаса, дереу қоңырау шалыңыз не біреуден қоңырау шалуын сұраңыз. Тынысын тексеруді кешіктірмеңіз.",
      request: "Жасыл күртеше киген қыз! Жедел жәрдем шақырыңыз!",
      aed: "Екінші куәгерден автоматты сыртқы дефибрилляторды (АСД) әкелуін сұраңыз, егер ол қолжетімді болса.",
      alone: "Жаныңызда ешкім болмаса және әлі ешкім қоңырау шалмаса, өзіңіз хабарласыңыз. Мүмкін болса, динамикті қосыңыз.",
    },
    call: {
      simulation: "Оқу симуляциясы. Нақты қоңырау шалынбайды.",
      practice: {
        heading: "Шұғыл көмек шақыру",
        introduction: "Көмекті қашан шақыру керегін білесіз. Енді шұғыл қызметке қоңырау шалуды жаттықтырыңыз.",
        task: "Қазақстандағы шұғыл қызмет нөмірін теріңіз.",
        notice: "Бұл — симуляция. Нақты қоңырау шалынбайды.",
        number: "Терілген нөмір", dial: "Оқу қоңырауы", erase: "Соңғы цифрды өшіру",
        retry: "Қайта көріңіз.",
        retryHelp: "Қазақстанда жедел жәрдемді 103 нөмірі арқылы шақыруға немесе 112 нөмірі арқылы бірыңғай шұғыл қызметке хабарласуға болады.",
        success: "Дұрыс нөмір",
        successHelp: "103 — жедел медициналық көмек. 112 — бірыңғай шұғыл қызмет.",
        proceed: "Жалғастыру", progress: "Шұғыл көмек шақыру кезеңінің қадамдары",
        source: "Қазақстанның шұғыл қызмет нөмірлері — ресми дереккөз",
      },
      report: {
        prompt: "Қай жердесіз және не болды?",
        context: "Маяк нұры алаңы, 18-мекенжайдағы «Ашық жағалау» қоғамдық орталығының негізгі кіреберісінде ер адам құлады. Ол жауап бермейді, қалыпты тыныс алмайды. Мекенжай ойдан шығарылған.",
        options: [
          "Қасымдағы ер адамның халі нашарлады. Көмек жіберіңізші.",
          "Маяк нұры алаңы, 18-мекенжайдағы «Ашық жағалау» қоғамдық орталығының негізгі кіреберісіндемін. Ер адам жауап бермейді, қалыпты тыныс алмайды.",
          "«Ашық жағалау» орталығының маңындамын. Ер адам құлады, инфаркт болған шығар.",
        ],
        correct: 3,
        accepted: "Дұрыс. Сіз оқиға орнын және адамның жағдайы туралы маңызды мәліметтерді айттыңыз.",
        retry: "Диспетчерге нақты мекенжайды және адамға не болғанын білу маңызды. Қайта жауап беріп көріңіз.",
        continue: "Әңгімені жалғастыру",
      },
      conversation: {
        dispatcher: "Диспетчер", missingNumber: "Нөмір сақталмаған",
        urgent: "Шын мәнінде жүрек тоқтаса, көмек шақырылғаннан кейін кеудені бірден баса бастаңыз.",
        instructions: [
          "Телефонның дауысзорайтқышын қосып, екі қолыңыз бос болу үшін телефонды жаныңызға қойыңыз.",
          "Қауіпсіз әрі кідіріссіз орындауға болса, адамның шалқасынан қатты, тегіс жерде жатқанына көз жеткізіңіз.",
          "Тынысын тексергенде байқағаныңызды растаңыз. Сирек қырылдап дем алу қалыпты тынысқа жатпайды.",
          "Жүрек-өкпе реанимациясын бастаңыз. Әрі қарай не істеу керегін айтып отырамын.",
        ],
        actions: ["Дауысзорайтқышты қосу", "Дене қалпы тексерілді", "Қалыпты тыныс жоқ"],
        confirmations: ["Симуляцияда дауысзорайтқыш қосылды.", "Дене қалпы тексерілді.", "Қалыпты тыныс жоқ екені расталды."],
        knownFinding: "Ер адамның тынысын тексердіңіз. Ол жауап бермейді және қалыпты тыныс алмайды.",
        yourAction: "Сіздің әрекетіңіз", speak: "Дауыстап, анық айтыңыз:", phrase: "ЖӨР алгоритмін бастаймын!",
        caution: "Бұл сөйлем оқу тапсырмасында қолданылады. Шынайы жағдайда оны айту міндетті емес. Кеудені кідіріссіз баса бастаңыз.",
        startCpr: "ЖӨР бастау", guidelines: "AHA нұсқаулығы, 2025",
      },
    },
  },
}
