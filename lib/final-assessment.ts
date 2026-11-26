import type { Language } from "./types"

type QuestionText = {
  topic: string
  prompt: string
  explanation: string
}

type Choice = QuestionText & {
  scene: string
  dispatcher?: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
  optionNotes?: [string, string, string, string]
}

export type FinalQuestion = Choice | (QuestionText & { placement: true })

// Adult community BLS: RCUK and AHA 2025. Keep the scenarios fictional.
export const finalQuestions: Record<Language, readonly FinalQuestion[]> = {
  ru: [
    {
      topic: "Безопасность места",
      scene: "На парковке человек внезапно падает между въездом и стоящим автомобилем. Сзади к нему приближается машина.",
      prompt: "Что нужно сделать первым?",
      options: [
        "Подойти к человеку и оценить дыхание, пока другой очевидец следит за машиной.",
        "Оставаясь в безопасном месте, оценить опасность и предупредить водителя. Когда подход станет безопасным, проверить реакцию человека.",
        "Перетащить человека на тротуар, чтобы затем проверить его реакцию.",
        "Остановиться у ног человека и крикнуть ему, не проверяя обстановку позади себя.",
      ],
      correct: 1,
      explanation: "Сначала оцените опасность для себя и окружающих. Когда подход безопасен, проверьте реакцию. При отсутствии реакции сразу вызовите помощь и оцените дыхание во время соединения или по указаниям диспетчера.",
    },
    {
      topic: "Проверка реакции",
      scene: "На дорожке в парке человек лежит неподвижно. Вы убедились, что к нему безопасно подойти.",
      prompt: "Как лучше проверить, реагирует ли человек?",
      options: [
        "Позвать его с расстояния нескольких метров и сразу считать молчание потерей сознания.",
        "Приподнять за предплечье, чтобы понять, может ли он сесть самостоятельно.",
        "Несколько раз энергично встряхнуть за плечи, чтобы добиться реакции.",
        "Подойти, громко обратиться к человеку и осторожно похлопать его по плечам.",
      ],
      correct: 3,
      explanation: "Громкое обращение и лёгкое похлопывание по плечам позволяют проверить реакцию. Для этого не нужно поднимать или сильно трясти человека.",
    },
    {
      topic: "Помощь очевидцев и АНД",
      scene: "Посетитель спортивного центра не реагирует. Рядом стоят несколько человек, а у стойки регистрации есть автоматический наружный дефибриллятор (АНД).",
      prompt: "Как распределить задачи?",
      options: [
        "Обратиться к девушке в зелёной куртке: вызвать скорую и назвать точное место. Другого очевидца попросить принести АНД.",
        "Громко сказать, что нужна помощь, и рассчитывать, что кто-нибудь вызовет скорую, а кто-нибудь найдёт АНД.",
        "Попросить ближайшего посетителя принести воды и попросить остальных пока оставаться рядом.",
        "Самому уйти к стойке за АНД, попросив людей следить за пострадавшим, но не поручив никому звонок.",
      ],
      correct: 0,
      explanation: "Обращение к конкретному человеку даёт ему понятную задачу и уменьшает риск, что все будут ждать действий друг от друга. Вызов помощи нужен сразу. Если есть второй очевидец, поручите ему принести АНД.",
    },
    {
      topic: "Разговор с диспетчером",
      scene: "Вымышленное место: вход B в павильон «Маяк», площадь Фонарей, 14. Взрослый человек упал, не реагирует и дышит ненормально.",
      dispatcher: "Что произошло и где вы находитесь?",
      prompt: "Какой ответ даст диспетчеру нужную для помощи информацию?",
      options: [
        "Я у павильона «Маяк». Человек лежит, мы пытаемся его разбудить. Приезжайте скорее.",
        "Приезжайте к входу B в павильон «Маяк», площадь Фонарей, 14. Похоже, у человека инфаркт.",
        "Павильон «Маяк», площадь Фонарей, 14, вход B. Человек упал, не реагирует и дышит ненормально. Нужна скорая.",
        "Площадь Фонарей, 14, вход B. Человек упал и не отвечает, но иногда вздыхает, значит, дыхание есть.",
      ],
      correct: 2,
      optionNotes: [
        "Не хватает точного адреса, входа и описания дыхания.",
        "Предполагаемый диагноз не заменяет наблюдения о реакции и дыхании.",
        "Указаны точное место, реакция, дыхание и просьба о помощи.",
        "Редкие ненормальные вздохи важно описать прямо: они не означают нормального дыхания.",
      ],
      explanation: "Назовите место и то, что наблюдаете. Если часть сведений ещё неизвестна, звоните сразу: диспетчер задаст уточняющие вопросы и скажет, что делать.",
    },
    {
      topic: "Ненормальное дыхание",
      scene: "Человек после внезапного падения не реагирует. Вы уже связались с диспетчером. Раз в несколько секунд слышен резкий судорожный вздох.",
      prompt: "Как оценить эти вздохи?",
      options: [
        "Считать дыхание нормальным, пока между вздохами видно движение грудной клетки.",
        "Считать вздохи ненормальным дыханием. Сообщить об этом диспетчеру и начать СЛР по его указаниям.",
        "Считать дыхание нормальным, если каждый отдельный вздох достаточно громкий.",
        "Подождать минуту, чтобы выяснить, станет ли дыхание регулярным, и только потом принимать решение.",
      ],
      correct: 1,
      explanation: "Редкие судорожные вздохи могут сопровождать остановку сердца. У человека без реакции ненормальное дыхание — основание начать СЛР без промедления. Очевидцу не нужно искать пульс.",
    },
    {
      topic: "Место для нажатий",
      placement: true,
      prompt: "Поставьте основание нижней ладони туда, где выполняют нажатия на грудную клетку взрослого.",
      explanation: "Основание нижней ладони ставят в центр грудной клетки, на нижнюю половину грудины. Нижний кончик грудины, рёбра и живот находятся за пределами этой зоны.",
    },
    {
      topic: "Положение рук и корпуса",
      scene: "Ученик встал на колени рядом с манекеном и правильно поставил руки. Инструктор просит показать следующее нажатие.",
      prompt: "Какое положение лучше подходит для нажатий?",
      options: [
        "Слегка согнуть локти, оставить плечи над кистями и надавливать в основном мышцами рук.",
        "Выпрямить локти, отвести плечи назад от кистей и надавливать под углом.",
        "Расположить плечи над кистями, но опираться всей ладонью и пальцами, чтобы руки не сместились.",
        "Держать локти прямыми, плечи над кистями и давить вертикально весом корпуса. Пальцы приподнять.",
      ],
      correct: 3,
      explanation: "Прямые локти и плечи над кистями помогают передавать усилие вертикально через основание нижней ладони. Сцепленные приподнятые пальцы не давят на рёбра.",
    },
    {
      topic: "Темп нажатий",
      scene: "Во время тренировки вы заметили, что устаёте и постепенно замедляетесь.",
      prompt: "К какому темпу нажатий следует стремиться при СЛР у взрослого?",
      options: ["100–120 в минуту", "80–100 в минуту", "120–140 в минуту", "90–110 в минуту"],
      correct: 0,
      explanation: "Рекомендуемый темп — 100–120 нажатий в минуту. Сохраняйте его, оставляя грудной клетке время полностью расправиться после каждого нажатия.",
    },
    {
      topic: "Глубина и расправление грудной клетки",
      scene: "Вы отрабатываете нажатия на учебном манекене с обратной связью о глубине.",
      prompt: "Какое сочетание глубины и техники верно для взрослого?",
      options: [
        "Около 5–6 см, оставляя лёгкое давление между нажатиями, чтобы не сбиться с темпа.",
        "Около 3–4 см с полным расправлением, чтобы снизить риск травмы у любого взрослого.",
        "Около 5–6 см, без опоры на грудную клетку между нажатиями и с минимумом пауз.",
        "Глубже 6 см, если полностью отпускать грудную клетку после каждого нажатия.",
      ],
      correct: 2,
      explanation: "Для взрослого ориентируются на 5–6 см, дают грудной клетке полностью расправиться и сводят перерывы к минимуму. Веб-камера CorCpr не измеряет фактическую глубину.",
    },
    {
      topic: "Нажатия и искусственные вдохи",
      scene: "Диспетчер просит начать СЛР взрослому. Вы не обучены искусственным вдохам, а другой очевидец уже ищет АНД.",
      prompt: "Как действовать до прибытия помощи?",
      options: [
        "Подождать очевидца с АНД, чтобы начать нажатия одновременно с его подключением.",
        "Начать непрерывные нажатия без вдохов и следовать указаниям диспетчера и АНД.",
        "Выполнить 30 нажатий и делать паузу после каждой серии, даже если никто не выполняет вдохи.",
        "Начать чередовать нажатия с искусственными вдохами, даже если вы никогда этому не обучались.",
      ],
      correct: 1,
      explanation: "Если вы не обучены или не готовы делать вдохи, выполняйте нажатия без плановых пауз на вдохи. Обученный и готовый спасатель может выполнять обычную СЛР в соотношении 30:2. Цель тренажёра в 30 нажатий сама по себе не повод прекращать реальную СЛР.",
    },
  ],
  en: [
    {
      topic: "Scene safety",
      scene: "Someone suddenly collapses in a car park, between the entrance and a parked vehicle. Another car is approaching.",
      prompt: "What should you do first?",
      options: [
        "Approach and check breathing while another bystander watches the approaching car.",
        "Stay in a safe place, assess the danger and warn the driver. Check for a response once you can approach safely.",
        "Drag the person to the pavement so you can check their response there.",
        "Stand at their feet and call out without checking the traffic behind you.",
      ],
      correct: 1,
      explanation: "Assess hazards to yourself and others first. Check for a response once it is safe to approach. If there is no response, call for help immediately and assess breathing while the call connects or as the dispatcher directs.",
    },
    {
      topic: "Checking for a response",
      scene: "Someone is lying still on a park path. You have confirmed it is safe to approach.",
      prompt: "How should you check for a response?",
      options: [
        "Call out from several metres away and assume they are unresponsive if they stay silent.",
        "Lift them by the forearm to see whether they can sit up on their own.",
        "Shake their shoulders several times to try to provoke a response.",
        "Approach, speak loudly and gently tap their shoulders.",
      ],
      correct: 3,
      explanation: "A loud verbal prompt and a gentle shoulder tap are enough to check for a response. There is no need to lift or vigorously shake the person.",
    },
    {
      topic: "Bystander help and the AED",
      scene: "A visitor at a sports centre is unresponsive. Several people are nearby, and there is an automated external defibrillator (AED) at reception.",
      prompt: "How should you assign tasks?",
      options: [
        "Ask the woman in the green jacket to call emergency services and give the exact location. Ask another bystander to bring the AED.",
        "Shout for help and trust the group to work out who should call and who should find the AED.",
        "Ask the nearest person to fetch water and tell everyone else to stay nearby.",
        "Go to reception for the AED yourself and ask people to watch the person without assigning anyone to call.",
      ],
      correct: 0,
      explanation: "A direct request gives each person a clear job and reduces the chance that everyone waits for someone else. Arrange the emergency call promptly. A second bystander can fetch the AED.",
    },
    {
      topic: "Talking to the dispatcher",
      scene: "Fictional location: entrance B of Beacon Pavilion, 14 Lantern Square. An adult collapsed, is unresponsive and is not breathing normally.",
      dispatcher: "What happened, and where are you?",
      prompt: "Which answer gives the dispatcher the information they need?",
      options: [
        "I'm by Beacon Pavilion. Someone is lying here and we are trying to wake them. Please come quickly.",
        "Come to entrance B of Beacon Pavilion, 14 Lantern Square. I think someone is having a heart attack.",
        "Beacon Pavilion, 14 Lantern Square, entrance B. Someone collapsed, is unresponsive and isn't breathing normally. We need an ambulance.",
        "14 Lantern Square, entrance B. Someone collapsed and won't respond, but takes the odd gasp, so they're breathing.",
      ],
      correct: 2,
      optionNotes: [
        "The exact address, entrance and breathing status are missing.",
        "A suspected diagnosis does not tell the dispatcher what you observed about responsiveness or breathing.",
        "You gave the exact location, responsiveness, breathing status and the request for help.",
        "Describe the occasional gasps directly: they do not mean the person is breathing normally.",
      ],
      explanation: "Give your location and say what you observe. Call immediately even if you do not know every detail. The dispatcher can ask questions and guide you.",
    },
    {
      topic: "Abnormal breathing",
      scene: "A person suddenly collapsed and is unresponsive. You have reached the dispatcher. The person makes a sharp gasp every few seconds.",
      prompt: "How should you interpret the gasps?",
      options: [
        "Treat breathing as normal as long as you see chest movement between the gasps.",
        "Treat the gasps as abnormal breathing, tell the dispatcher and begin CPR as directed.",
        "Treat breathing as normal if each gasp is loud enough.",
        "Wait a minute to see whether breathing becomes regular before deciding what to do.",
      ],
      correct: 1,
      explanation: "Occasional agonal gasps can accompany cardiac arrest. If a person is unresponsive and breathing abnormally, start CPR without delay. A bystander does not need to check for a pulse.",
    },
    {
      topic: "Where to place the hands",
      placement: true,
      prompt: "Position the heel of the lower hand where you would compress an adult's chest.",
      explanation: "Place the heel of the lower hand in the centre of the chest, on the lower half of the breastbone. The very bottom tip of the bone, the ribs and the abdomen are outside this area.",
    },
    {
      topic: "Arm and body position",
      scene: "A learner kneels beside a manikin and places their hands correctly. The instructor asks them to demonstrate the next compression.",
      prompt: "Which position best supports chest compressions?",
      options: [
        "Bend the elbows slightly, keep shoulders above hands and press mainly with the arm muscles.",
        "Lock the elbows, keep the shoulders behind the hands and press at an angle.",
        "Keep the shoulders over the hands and press with the whole palm and fingers to prevent slipping.",
        "Keep elbows straight and shoulders above the hands. Press vertically with body weight, with fingers lifted.",
      ],
      correct: 3,
      explanation: "Straight elbows and shoulders above the hands direct force vertically through the heel of the lower hand. Interlocked, lifted fingers stay clear of the ribs.",
    },
    {
      topic: "Compression rate",
      scene: "During practice, you notice you are tiring and your rate is dropping.",
      prompt: "What adult chest compression rate should you aim for?",
      options: ["100–120 per minute", "80–100 per minute", "120–140 per minute", "90–110 per minute"],
      correct: 0,
      explanation: "Aim for 100–120 compressions per minute, allowing the chest to recoil fully after every compression.",
    },
    {
      topic: "Compression depth and recoil",
      scene: "You are practising on a manikin with feedback on compression depth.",
      prompt: "Which combination of depth and technique is appropriate for an adult?",
      options: [
        "About 5–6 cm, keeping a little pressure on the chest between compressions to stay in rhythm.",
        "About 3–4 cm with full recoil, to reduce the risk of injury in any adult.",
        "About 5–6 cm, with full recoil between compressions and as few pauses as possible.",
        "Deeper than 6 cm, as long as the chest returns fully after each compression.",
      ],
      correct: 2,
      explanation: "For an adult, aim for 5–6 cm, allow complete recoil and minimise interruptions. The CorCpr webcam does not measure actual compression depth.",
    },
    {
      topic: "Compressions and rescue breaths",
      scene: "The dispatcher tells you to start CPR on an adult. You have not been trained to give rescue breaths. Someone else is getting the AED.",
      prompt: "What should you do while help is on the way?",
      options: [
        "Wait for the AED so you can start compressions when it is attached.",
        "Start continuous chest compressions without breaths and follow the dispatcher and AED prompts.",
        "Give 30 compressions and pause after each set, even if no one is giving breaths.",
        "Start alternating compressions and rescue breaths even though you have never been trained to do so.",
      ],
      correct: 1,
      explanation: "If you are untrained or unwilling to give breaths, provide compressions without planned pauses for breaths. A trained, willing rescuer can use conventional adult CPR at 30:2. Reaching the app's target of 30 compressions is no reason to stop real CPR.",
    },
  ],
  kk: [
    {
      topic: "Оқиға орнының қауіпсіздігі",
      scene: "Көлік тұрағында бір адам кіреберіс пен тұрған көліктің ортасына құлады. Оған қарай тағы бір көлік келе жатыр.",
      prompt: "Алдымен не істейсіз?",
      options: [
        "Басқа куәгер көлікті бақылап тұрғанда, адамға жақындап, тынысын тексеремін.",
        "Қауіпсіз жерде тұрып, жағдайды бағалаймын және жүргізушіге белгі беремін. Жақындау қауіпсіз болғанда, адамның жауап беретінін тексеремін.",
        "Адамды жаяужолға сүйреп апарып, сол жерде жауап беретінін тексеремін.",
        "Артымдағы көлік қозғалысын тексермей, адамның аяғына жақындап, оған дауыстаймын.",
      ],
      correct: 1,
      explanation: "Әуелі өзіңізге және айналадағы адамдарға төнген қауіпті бағалаңыз. Қауіпсіз болғанда жауапты тексеріңіз. Адам жауап бермесе, бірден көмек шақырып, қоңырау қосылып жатқанда не диспетчер нұсқауымен тынысын бағалаңыз.",
    },
    {
      topic: "Жауапты тексеру",
      scene: "Саябақтың жолында бір адам қимылсыз жатыр. Оған жақындау қауіпсіз екеніне көз жеткіздіңіз.",
      prompt: "Адамның жауап беретінін қалай тексересіз?",
      options: [
        "Бірнеше метр жерден дауыстаймын да, үн қатпаса, бірден жауап бермейді деп есептеймін.",
        "Өзі отыра ала ма деп, білегінен ұстап көтеремін.",
        "Жауап беруі үшін иығынан ұстап, бірнеше рет қатты сілкимін.",
        "Жақындап, дауыстап тіл қатамын және иығынан ақырын қағамын.",
      ],
      correct: 3,
      explanation: "Жауапты тексеру үшін адамға дауыстап тіл қатып, иығынан ақырын қағу жеткілікті. Оны көтерудің немесе қатты сілкудің қажеті жоқ.",
    },
    {
      topic: "Куәгерлердің көмегі және АСД",
      scene: "Спорт орталығында бір адам жауап бермей жатыр. Қасында бірнеше куәгер бар. Қабылдау орнында автоматты сыртқы дефибриллятор (АСД) тұр.",
      prompt: "Міндеттерді қалай бөлесіз?",
      options: [
        "Жасыл күртеше киген қыздан жедел жәрдем шақырып, нақты мекенжайды айтуды сұраймын. Басқа куәгерден АСД әкелуді сұраймын.",
        "Бәріне көмек керек деп дауыстаймын. Кім қоңырау шалып, кім АСД әкелетінін өздері шешсін.",
        "Ең жақын адамнан су әкелуді, қалғандарынан қасымызда қалуды сұраймын.",
        "Куәгерлерден адамды бақылап тұруды сұрап, өзім АСД алуға кетемін. Қоңырау шалуды ешкімге тапсырмаймын.",
      ],
      correct: 0,
      explanation: "Нақты адамға тапсырма берсеңіз, ол не істеу керегін біледі және басқаны күтпейді. Шұғыл көмекті дереу шақыртыңыз. Екінші куәгер болса, одан АСД әкелуді сұраңыз.",
    },
    {
      topic: "Диспетчермен сөйлесу",
      scene: "Ойдан шығарылған орын: Шамдар алаңы, 14, «Маяк» павильонының B кіреберісі. Ересек адам құлап, жауап бермей жатыр, тынысы қалыпты емес.",
      dispatcher: "Не болды және қай жерде тұрсыз?",
      prompt: "Диспетчерге қажетті мәліметті қай жауап береді?",
      options: [
        "«Маяк» павильонының жанындамын. Бір адам жатыр, оята алмай жатырмыз. Тез келіңіздер.",
        "Шамдар алаңы, 14, «Маяк» павильонының B кіреберісіне келіңіздер. Бір адамның жүрек талмасы ұстап қалған сияқты.",
        "Шамдар алаңы, 14, «Маяк» павильонының B кіреберісіндемін. Бір адам құлап, жауап бермейді, тынысы қалыпты емес. Жедел жәрдем керек.",
        "Шамдар алаңы, 14, B кіреберісіндемін. Бір адам құлап, жауап бермей жатыр. Ара-тұра дем тартады, демек тынысы бар.",
      ],
      correct: 2,
      optionNotes: [
        "Нақты мекенжай, кіреберіс және адамның қалай тыныс алып жатқаны айтылмады.",
        "Болжамды диагноз адамның жауап беруі мен тынысы туралы нақты мәліметті алмастырмайды.",
        "Нақты орын, адамның жауап бермеуі, тынысының қалыпты еместігі және көмек қажет екені айтылды.",
        "Ара-тұра ауа қармап дем тартуын нақты сипаттаңыз. Бұл қалыпты тыныстың белгісі емес.",
      ],
      explanation: "Нақты орынды айтып, байқағаныңызды сипаттаңыз. Кей мәлімет белгісіз болса да, дереу қоңырау шалыңыз. Диспетчер сұрақ қойып, не істеу керегін айтады.",
    },
    {
      topic: "Қалыптан тыс тыныс",
      scene: "Кенет құлаған адам жауап бермейді. Диспетчермен байланыстасыз. Адам бірнеше секунд сайын ауа қармап, күрт дем тартады.",
      prompt: "Мұндай тынысты қалай бағалайсыз?",
      options: [
        "Дем тартулар арасында кеуде қимылдаса, тынысты қалыпты деп есептеймін.",
        "Тынысы қалыпты емес екенін диспетчерге айтып, нұсқауы бойынша ЖӨР бастаймын.",
        "Әр дем тартуы қатты естілсе, тынысты қалыпты деп есептеймін.",
        "Тынысы бірқалыпты бола ма деп бір минут күтіп, содан кейін шешім қабылдаймын.",
      ],
      correct: 1,
      explanation: "Сирек әрі күрт дем тарту жүрек тоқтағанда байқалуы мүмкін. Адам жауап бермесе әрі тынысы қалыпты болмаса, ЖӨР-ді кідіріссіз бастаңыз. Куәгерге тамыр соғысын іздеудің қажеті жоқ.",
    },
    {
      topic: "Қол қоятын жер",
      placement: true,
      prompt: "Астыңғы алақанның түбін ересек адамның кеудесін басатын жерге қойыңыз.",
      explanation: "Астыңғы алақанның түбі кеуденің ортасына, төс сүйегінің төменгі жартысына қойылады. Төс сүйегінің ең төменгі ұшы, қабырғалар және іш бұл аймаққа кірмейді.",
    },
    {
      topic: "Қол мен дене қалпы",
      scene: "Үйренуші манекеннің жанына тізерлеп, қолын дұрыс қойды. Нұсқаушы одан келесі басу қимылын көрсетуді сұрады.",
      prompt: "Кеудені басу үшін қай қалып дұрыс?",
      options: [
        "Шынтақты сәл бүгіп, иықты қол үстінде ұстау және негізінен қол бұлшық етімен басу.",
        "Шынтақты тіктеп, иықты қолдың артында ұстап, кеудені қиғаш бағытта басу.",
        "Иықты қол үстінде ұстап, қол тайып кетпеуі үшін кеудені бүкіл алақанмен және саусақпен басу.",
        "Шынтақты тік, иықты қолдың үстінде ұстап, дене салмағымен тігінен басу. Саусақтарды көтеріп ұстау.",
      ],
      correct: 3,
      explanation: "Шынтақ тік, иық қолдың үстінде болса, күш астыңғы алақанның түбі арқылы тігінен беріледі. Айқастырып көтерілген саусақтар қабырғаға қысым түсірмейді.",
    },
    {
      topic: "Басу қарқыны",
      scene: "Жаттығу кезінде шаршап, кеудені баяуырақ баса бастағаныңызды байқадыңыз.",
      prompt: "Ересек адамның кеудесін қандай қарқынмен басу ұсынылады?",
      options: ["Минутына 100–120 рет", "Минутына 80–100 рет", "Минутына 120–140 рет", "Минутына 90–110 рет"],
      correct: 0,
      explanation: "Ұсынылатын қарқын — минутына 100–120 рет. Әр басқан сайын кеуденің толық қалпына келуіне мүмкіндік беріңіз.",
    },
    {
      topic: "Басу тереңдігі және кеуденің қалпына келуі",
      scene: "Кеудені қанша тереңдікке басқаныңызды көрсететін манекенде жаттығып жатырсыз.",
      prompt: "Ересек адамға қай тереңдік пен тәсіл сәйкес келеді?",
      options: [
        "Шамамен 5–6 см. Ырғақ бұзылмауы үшін басу арасында кеудені сәл басып тұру.",
        "Кез келген ересек адамның жарақат алу қаупін азайту үшін шамамен 3–4 см басып, кеудені толық босату.",
        "Шамамен 5–6 см. Басу арасында кеудені толық босатып, үзілісті барынша азайту.",
        "Әр басқаннан кейін кеуде толық қалпына келсе, 6 см-ден терең басу.",
      ],
      correct: 2,
      explanation: "Ересек адамда шамамен 5–6 см басып, әр басудан кейін кеуденің толық қалпына келуіне мүмкіндік беріңіз. Үзілісті барынша азайтыңыз. CorCpr камерасы нақты басу тереңдігін өлшемейді.",
    },
    {
      topic: "Кеудені басу және жасанды тыныс",
      scene: "Диспетчер ересек адамға ЖӨР бастауды тапсырды. Жасанды тыныс беруді үйренбегенсіз, ал басқа куәгер АСД әкелуге кетті.",
      prompt: "Көмек келгенше не істейсіз?",
      options: [
        "АСД келгенін күтемін де, оны жалғаған кезде кеудені басуды бастаймын.",
        "Жасанды тыныс бермей, кеудені үздіксіз басамын және диспетчер мен АСД нұсқауларын орындаймын.",
        "Кеудені әр 30 рет басқаннан кейін, ешкім жасанды тыныс бермесе де, үзіліс жасаймын.",
        "Үйренбеген болсам да, кеудені басу мен жасанды тыныс беруді кезектестіремін.",
      ],
      correct: 1,
      explanation: "Жасанды тыныс беруді үйренбесеңіз немесе беруге дайын болмасаңыз, кеудені үздіксіз басыңыз. Үйренген әрі дайын адам ересектерге арналған 30:2 қатынасын қолдана алады. Жаттықтырғыштағы 30 рет басу мақсаты нақты жағдайда ЖӨР-ді тоқтатуды білдірмейді.",
    },
  ],
}
