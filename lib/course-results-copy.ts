import type { Language } from "./types"

type CourseResultsCopy = Record<
  "camera" | "rate" | "cameraNote" | "learning" | "firstChecks" | "attempted" |
  "right" | "wrong" | "unavailable" | "completed" | "incomplete" | "stack" | "placement" |
  "post" | "inCourse" | "afterPractice" | "subjective" | "submit" | "higher" | "lower" | "same" |
  "startTest" | "test" | "viewSummary" | "summary" | "total" | "knowledge" |
  "mastered" | "review" | "none" | "reviewAdvice" | "practiceAdvice" | "certification" |
  "diagramInstructions" | "marker" | "guidelines" | "simulation", string
>

export const courseResultsCopy: Record<Language, CourseResultsCopy> = {
  ru: {
    camera: "Тренировка с камерой",
    rate: "Последняя оценка темпа",
    cameraNote: "Оценки описывают движения в учебном упражнении. Камера не измеряет глубину или силу нажатий и не определяет медицинскую эффективность СЛР.",
    learning: "Вопросы и упражнения курса",
    firstChecks: "По каждому вопросу учтён первый проверенный ответ.",
    attempted: "Вопросов с ответом", right: "Верных ответов", wrong: "Неверных ответов",
    unavailable: "Данные недоступны", completed: "Выполнено", incomplete: "Не завершено",
    stack: "Положение кистей", placement: "Постановка рук на грудину",
    post: "Как изменилась твоя уверенность?", inCourse: "Во время курса", afterPractice: "После практики",
    subjective: "Это самооценка твоей уверенности. Практический навык оценивают отдельно.",
    submit: "Сравнить ответы", higher: "Уверенность выросла.", lower: "Уверенность снизилась.", same: "Уверенность осталась на прежнем уровне.",
    startTest: "Начать итоговую проверку", test: "Итоговая проверка знаний", viewSummary: "Посмотреть итог",
    summary: "Итоги обучения", total: "Всего вопросов", knowledge: "Результат проверки знаний",
    mastered: "Темы с верными ответами", review: "Темы для повторения", none: "Нет",
    reviewAdvice: "Повторите отмеченные темы и отработайте последовательность действий на манекене с инструктором.",
    practiceAdvice: "Закрепите последовательность действий на манекене с инструктором.",
    certification: "Это учебный результат. Для сертификации требуется отдельное обучение и оценка практических навыков.",
    diagramInstructions: "Нажмите на схему, чтобы поставить кисти. С клавиатуры выберите кисти клавишей Tab и перемещайте их стрелками.",
    marker: "Сложенные кисти. Прицел отмечает основание нижней ладони.",
    guidelines: "Рекомендации по базовой реанимации взрослых", simulation: "Учебная симуляция звонка",
  },
  kk: {
    camera: "Камерамен жаттығу",
    rate: "Соңғы есептелген қарқын",
    cameraNote: "Бағалар оқу жаттығуындағы қимылдарды сипаттайды. Камера кеудені басудың тереңдігін немесе күшін өлшемейді және ЖӨР-дің медициналық тиімділігін анықтамайды.",
    learning: "Курстың сұрақтары мен жаттығулары",
    firstChecks: "Әр сұрақтың алғаш тексерілген жауабы есепке алынды.",
    attempted: "Жауап берілген сұрақтар", right: "Дұрыс жауаптар", wrong: "Қате жауаптар",
    unavailable: "Дерек жоқ", completed: "Орындалды", incomplete: "Аяқталмады",
    stack: "Қолды беттестіру", placement: "Қолды төс сүйегіне қою",
    post: "Сенімділігің қалай өзгерді?", inCourse: "Курс барысында", afterPractice: "Жаттығудан кейін",
    subjective: "Бұл жауап өзіңді қаншалықты сенімді сезінетініңді көрсетеді. Практикалық дағды бөлек бағаланады.",
    submit: "Жауаптарды салыстыру", higher: "Сенімділігің артты.", lower: "Сенімділігің азайды.", same: "Сенімділігің өзгермеді.",
    startTest: "Қорытынды тексеруді бастау", test: "Білімді қорытынды тексеру", viewSummary: "Қорытындыны көру",
    summary: "Оқу қорытындысы", total: "Сұрақ саны", knowledge: "Білімді тексеру нәтижесі",
    mastered: "Дұрыс жауап берілген тақырыптар", review: "Қайталау қажет тақырыптар", none: "Жоқ",
    reviewAdvice: "Белгіленген тақырыптарды қайталап, әрекеттердің ретін нұсқаушымен бірге манекенде жаттықтырыңыз.",
    practiceAdvice: "Әрекеттердің ретін нұсқаушымен бірге манекенде қайталап бекітіңіз.",
    certification: "Бұл — оқу нәтижесі. Сертификат алу үшін бөлек оқудан өтіп, практикалық дағдыны бағалату қажет.",
    diagramInstructions: "Қолдарды қою үшін сызбаны басыңыз. Пернетақтада қолдарды Tab пернесімен таңдап, бағыттауыш пернелермен жылжытыңыз.",
    marker: "Беттестірілген қолдар. Айқыш белгі астыңғы алақанның түбін көрсетеді.",
    guidelines: "Ересектерге базалық реанимация жасау нұсқаулығы", simulation: "Қоңырау шалу симуляциясы",
  },
  en: {
    camera: "Camera training performance",
    rate: "Latest estimated rate",
    cameraNote: "These scores describe movement in the training exercise. The camera cannot measure compression depth or force or determine clinical CPR effectiveness.",
    learning: "Course questions and exercises",
    firstChecks: "Each question counts the first answer you checked.",
    attempted: "Questions answered", right: "Correct answers", wrong: "Incorrect answers",
    unavailable: "Data unavailable", completed: "Complete", incomplete: "Incomplete",
    stack: "Stacking the hands", placement: "Placing the hands on the breastbone",
    post: "How has your confidence changed?", inCourse: "During the course", afterPractice: "After practice",
    subjective: "This reflects how confident you feel. Practical competence is assessed separately.",
    submit: "Compare answers", higher: "Your confidence increased.", lower: "Your confidence decreased.", same: "Your confidence stayed the same.",
    startTest: "Start final assessment", test: "Final knowledge assessment", viewSummary: "View summary",
    summary: "Learning summary", total: "Total questions", knowledge: "Knowledge assessment score",
    mastered: "Topics answered correctly", review: "Topics to review", none: "None",
    reviewAdvice: "Revisit the topics marked for review and practise the sequence on a manikin with an instructor.",
    practiceAdvice: "Reinforce what you learned by practising the sequence on a manikin with an instructor.",
    certification: "This is an educational result. Certification requires separate training and a practical assessment.",
    diagramInstructions: "Tap or click the diagram to position the hands. With a keyboard, use Tab to select the hands and the arrow keys to move them.",
    marker: "Stacked hands. The crosshair marks the heel of the lower hand.",
    guidelines: "Adult basic life support guidelines", simulation: "Simulated emergency call",
  },
}
