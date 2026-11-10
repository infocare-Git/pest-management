import type { ConditionId } from "./types";

/**
 * Pests and diseases covered by Module 1 for mandarin.
 *
 * DRAFT CONTENT: symptoms and management advice must be reviewed and signed off by
 * NAFHA's plant-protection experts before field use. The Nepali `voiceNe` script is
 * what the farmer hears; keep it short, plain and free of brand names.
 */
export interface ConditionInfo {
  id: ConditionId;
  kind: "disease" | "pest" | "status";
  nameEn: string;
  nameNe: string;
  scientific?: string;
  /** Visible signs a lead farmer should photograph. */
  symptomsEn: string[];
  /** Management steps (English, for the lead farmer and expert). */
  actionsEn: string[];
  /** Nepali voice / text guidance for the farmer. */
  voiceNe: string;
  severity: "critical" | "high" | "medium" | "none";
  /** Diagnosis must be reported to the authority. */
  notifiable?: boolean;
}

export const CONDITIONS: Record<ConditionId, ConditionInfo> = {
  citrus_greening: {
    id: "citrus_greening",
    kind: "disease",
    nameEn: "Citrus greening (HLB)",
    nameNe: "सिट्रस ग्रिनिङ (हरियो रोग)",
    scientific: "Candidatus Liberibacter asiaticus",
    symptomsEn: [
      "Blotchy, uneven yellow mottling on leaves that is different on each side of the midrib",
      "Small, upright, thickened leaves; yellow shoots",
      "Small, lopsided fruit that stays green at the bottom and tastes bitter",
      "Twig dieback and early fruit drop",
    ],
    actionsEn: [
      "There is no cure. Uproot and destroy confirmed infected trees so they do not infect others.",
      "Control the citrus psyllid, which spreads the disease, across the whole orchard.",
      "Do not take budwood or graft from infected or suspect trees.",
      "Replant only with certified, disease-tested saplings and check the batch code before buying.",
      "Report to the Agriculture Knowledge Centre. The source nursery is traced automatically for new orchards.",
    ],
    voiceNe:
      "यो बोटमा सिट्रस ग्रिनिङ रोगको लक्षण देखिएको छ। यो रोगको उपचार छैन। रोगी बोटलाई जरैसहित उखेलेर नष्ट गर्नुहोस्, ताकि अरू बोटमा नसरोस्। यो रोग सिट्रस सिल्ला भन्ने सानो कीराले सार्छ, त्यसैले पूरै बगैंचामा सिल्ला नियन्त्रण गर्नुहोस्। रोगी बोटबाट कलमी नलिनुहोस्। नयाँ बिरुवा सधैं प्रमाणित र रोग परीक्षण गरिएको नर्सरीबाट मात्र किन्नुहोस्, र किन्नुअघि ब्याच कोड जाँच गर्नुहोस्। नजिकको कृषि ज्ञान केन्द्रलाई खबर गर्नुहोस्।",
    severity: "critical",
    notifiable: true,
  },
  citrus_psyllid: {
    id: "citrus_psyllid",
    kind: "pest",
    nameEn: "Asian citrus psyllid",
    nameNe: "सिट्रस सिल्ला कीरा",
    scientific: "Diaphorina citri",
    symptomsEn: [
      "Small brown insects sitting at a 45° angle on tender new shoots",
      "Yellow-orange nymphs with white, waxy threads on new leaves",
      "Curled, twisted or burnt-looking new flush",
    ],
    actionsEn: [
      "Check new shoots every week, especially during each flush.",
      "Hang yellow sticky traps to monitor numbers.",
      "Spray neem-based products, or a recommended insecticide on the advice of a technician, when new flush appears. Coordinate spraying with neighbours.",
      "Remove unwanted water shoots and nearby host plants such as kamini (Murraya).",
      "Watch for greening symptoms. The psyllid spreads greening.",
    ],
    voiceNe:
      "तपाईंको बगैंचामा सिट्रस सिल्ला कीरा देखिएको छ। यो कीराले सिट्रस ग्रिनिङ रोग सार्छ, त्यसैले बेलैमा नियन्त्रण गर्नु जरुरी छ। हरेक हप्ता नयाँ मुना जाँच गर्नुहोस्। पहेँलो टाँसिने पासो झुण्ड्याउनुहोस्। नयाँ मुना पलाउँदा निमको झोल वा कृषि प्राविधिकले सिफारिस गरेको विषादी छर्नुहोस्, र छिमेकीसँग मिलेर एकै समयमा छर्नुहोस्। अनावश्यक मुना र नजिकका कामिनीका बोट हटाउनुहोस्।",
    severity: "high",
  },
  fruit_fly: {
    id: "fruit_fly",
    kind: "pest",
    nameEn: "Citrus fruit fly",
    nameNe: "फल कुहाउने औंसा (फल झिंगा)",
    scientific: "Bactrocera minax / B. dorsalis",
    symptomsEn: [
      "Fruit turning yellow early and dropping before harvest",
      "Small puncture marks on the rind, rotting patches",
      "White maggots inside fallen or cut fruit",
    ],
    actionsEn: [
      "Collect fallen and infested fruit every day and bury it at least 1 m deep, or seal it in plastic bags in the sun.",
      "Use protein bait sprays or bait traps from early fruit set, on the advice of a technician.",
      "Work as a community. Fruit flies move between orchards, so neighbours must act together.",
      "Plough lightly under the canopy in winter to expose pupae.",
    ],
    voiceNe:
      "तपाईंको बगैंचामा फल कुहाउने औंसाको लक्षण देखिएको छ। झरेका र औंसा परेका फलहरू हरेक दिन टिपेर कम्तीमा एक मिटर गहिरो खाडलमा गाड्नुहोस्, वा प्लास्टिकको थैलोमा बन्द गरेर घाममा राख्नुहोस्। फल लाग्न सुरु भएपछि प्राविधिकको सल्लाहमा प्रोटिन बिष पासो प्रयोग गर्नुहोस्। यो कीरा एक बगैंचाबाट अर्कोमा सर्छ, त्यसैले गाउँका सबै किसान मिलेर नियन्त्रण गर्नुहोस्।",
    severity: "high",
  },
  citrus_canker: {
    id: "citrus_canker",
    kind: "disease",
    nameEn: "Citrus canker",
    nameNe: "सिट्रस क्याङ्कर (दाद रोग)",
    scientific: "Xanthomonas citri",
    symptomsEn: [
      "Raised, rough, corky brown spots on leaves, twigs and fruit",
      "Spots surrounded by a yellow halo",
      "Spots visible on both sides of the leaf",
    ],
    actionsEn: [
      "Prune infected twigs and leaves in dry weather and burn them.",
      "Spray a copper-based fungicide (e.g. Bordeaux mixture) after pruning and before the rainy season.",
      "Control leaf miner, whose wounds let canker in.",
      "Disinfect pruning tools between trees.",
    ],
    voiceNe:
      "यो बोटमा सिट्रस क्याङ्कर रोग देखिएको छ। सुख्खा मौसममा रोग लागेका हाँगा र पात काटेर जलाउनुहोस्। काटिसकेपछि र वर्षा सुरु हुनुअघि बोर्डो मिश्रण जस्ता तामायुक्त विषादी छर्नुहोस्। पातमा सुरुङ बनाउने कीरा नियन्त्रण गर्नुहोस्। एउटा बोट काटेपछि अर्को बोट काट्नुअघि औजार सफा गर्नुहोस्।",
    severity: "medium",
  },
  gummosis: {
    id: "gummosis",
    kind: "disease",
    nameEn: "Gummosis / foot rot",
    nameNe: "गमोसिस (फेद कुहाउने रोग)",
    scientific: "Phytophthora spp.",
    symptomsEn: [
      "Gum oozing from cracks in the bark near the base of the trunk",
      "Bark at the base turning dark, soft and peeling",
      "Yellowing leaves and general decline of the tree",
    ],
    actionsEn: [
      "Improve drainage and keep water from standing around the trunk.",
      "Scrape away infected bark down to healthy tissue and paint the wound with Bordeaux paste.",
      "Keep the graft union well above soil level and mulch away from the trunk.",
      "Avoid wounding the trunk when weeding or digging.",
    ],
    voiceNe:
      "यो बोटमा गमोसिस अर्थात फेद कुहाउने रोग देखिएको छ। बोटको फेदमा पानी जम्न नदिनुहोस् र पानी निकासको व्यवस्था गर्नुहोस्। रोग लागेको बोक्रा स्वस्थ भाग देखिनेसम्म खुर्केर हटाउनुहोस् र घाउमा बोर्डो लेदो लगाउनुहोस्। कलमी गरेको जोर्नी माटोभन्दा माथि राख्नुहोस्। गोडमेल गर्दा फेदमा चोट नपुर्‍याउनुहोस्।",
    severity: "high",
  },
  healthy: {
    id: "healthy",
    kind: "status",
    nameEn: "No disease detected",
    nameNe: "रोग देखिएन",
    symptomsEn: [],
    actionsEn: [
      "Keep checking new shoots for psyllid and leaves for greening symptoms.",
      "Continue good orchard hygiene and balanced nutrition.",
    ],
    voiceNe:
      "फोटोमा कुनै रोग वा कीरा देखिएन। तैपनि नयाँ मुनामा सिल्ला कीरा र पातमा ग्रिनिङको लक्षण नियमित जाँच गर्नुहोस्। बगैंचा सफा राख्नुहोस् र सन्तुलित मलखाद दिनुहोस्।",
    severity: "none",
  },
  unclear: {
    id: "unclear",
    kind: "status",
    nameEn: "Photo not clear enough",
    nameNe: "फोटो प्रष्ट छैन",
    symptomsEn: [],
    actionsEn: [
      "Take new photos in daylight, close to the affected leaf, fruit or bark, in focus.",
      "Photograph both sides of the leaf, and include one photo of the whole tree.",
    ],
    voiceNe:
      "फोटो प्रष्ट नभएकाले रोग पहिचान गर्न सकिएन। दिउँसोको उज्यालोमा, रोग लागेको पात, फल वा बोक्राको नजिकबाट प्रष्ट फोटो फेरि खिच्नुहोस्। पातको दुवैतर्फको फोटो र पूरै बोटको एउटा फोटो पनि पठाउनुहोस्।",
    severity: "none",
  },
};

/** Conditions the classifier can predict (everything except "unclear"). */
export const MODEL_CLASSES: ConditionId[] = [
  "citrus_greening",
  "citrus_psyllid",
  "fruit_fly",
  "citrus_canker",
  "gummosis",
  "healthy",
];

export const ALL_CONDITIONS: ConditionId[] = [...MODEL_CLASSES, "unclear"];
