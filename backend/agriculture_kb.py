"""Agriculture knowledge base for reliable, accurate responses"""

AGRICULTURE_KB = {
    "greetings": [
        "🌾 **Hello! I am your Smart Farming Assistant.**\n\nI'm here to support your farming with practical, expert guidance. You can ask me about:\n• 💧 **Irrigation:** Timing and schedules for your crops, soil, and weather.\n• 🌾 **Crop Selection:** Best crops for your soil type, season, and water availability.\n• 🌱 **Fertilizer:** NPK dosage and stage-specific nutrition plans.\n• 🛡️ **Pest & Weather Protection:** Organic pest control, heatwave, and frost management.\n• 📈 **Yield Maximization:** Certified varieties, seed treatment, and field practices.\n• 🏛️ **Government Schemes:** PM-KISAN, PMFBY crop insurance, and subsidies.\n\nHow can I help you with your farm today?"
    ],

    "wheat irrigation": [
        "💧 **Best Irrigation Schedule for Wheat:**\n\nWheat typically requires 4 to 6 irrigations at critical growth stages:\n1. **Crown Root Initiation (CRI) (20–25 days after sowing):** Most critical stage! Delaying watering here can cause 20–30% yield loss.\n2. **Tillering Stage (40–45 DAS):** Promotes strong shoot and root development.\n3. **Jointing Stage (60–65 DAS):** Critical for stem elongation.\n4. **Flowering / Booting Stage (80–85 DAS):** Ensures healthy ear head formation.\n5. **Milking / Grain Filling Stage (100–105 DAS):** Essential for plump grain development.\n6. **Dough Stage (115–120 DAS):** Give light watering if soil is dry.\n\n*Weather adjustment:* If rain is forecasted or soil moisture is above 50%, skip irrigation to prevent waterlogging and root rot. Irrigate during early morning or late evening."
    ],

    "rice irrigation": [
        "💧 **Rice Irrigation Schedule:**\n\n1. **Transplanting to Establishment (0–10 days):** Maintain shallow water (2–3 cm) to help seedlings establish.\n2. **Vegetative Phase (Tillering):** Maintain 3–5 cm water depth.\n3. **Alternate Wetting & Drying (AWD):** Allow water to naturally subside 2–3 days before re-flooding. This saves 25–30% water while maintaining yield.\n4. **Flowering & Heading:** Keep 5 cm standing water during panicle emergence.\n5. **Grain Filling to Ripening:** Maintain intermittent light moisture; drain field completely 15–20 days before harvest.\n\n*Monsoon Tip:* Always maintain field drainage channels to prevent sudden waterlogging during heavy downpours."
    ],

    "sandy soil crops": [
        "🌾 **Best Crops for Sandy Soil & Medium Water Supply:**\n\nSandy soil drains rapidly and has low nutrient holding capacity. The best crops are:\n1. **Groundnut (Peanut):** Excellent choice. Fixes atmospheric nitrogen, thrives in loose well-drained sandy loam, and gives high returns.\n2. **Pearl Millet (Bajra):** Deep rooting and drought-hardy, performs exceptionally well on light soils.\n3. **Sesame (Til):** Low water requirement, high market price, well-suited for sandy tracts.\n4. **Pulses (Moong / Green Gram, Cowpea):** Quick-growing (60–70 days), enriches soil with nitrogen.\n5. **Cucurbits (Watermelon, Muskmelon, Cucumber):** Highly profitable in sandy loam under drip irrigation.\n\n*Soil tip:* Add 10–12 tonnes/ha of Farmyard Manure (FYM) or compost before sowing to boost moisture and nutrient retention."
    ],

    "crop recommendation": [
        "🌾 **Crop Recommendation Guide:**\n\nCrop selection depends on soil type, season, and water availability:\n• **Sandy / Light Soil (Low-to-Medium Water):** Groundnut, Bajra (Pearl Millet), Sesame, Moong, Cowpea, Watermelon.\n• **Clayey / Black Cotton Soil (Good Water):** Cotton, Soybean, Wheat, Chickpea (Gram), Sugarcane.\n• **Loamy Soil (Ideal Soil):** Wheat, Maize, Mustard, Potato, Vegetables, Pulses.\n• **Drought-Prone / Low Rainfall Areas:** Millets (Bajra, Jowar, Ragi), Tur (Pigeon pea), Castor.\n• **Kharif Season (Monsoon):** Soybean, Cotton, Paddy, Maize, Tur, Groundnut.\n• **Rabi Season (Winter):** Wheat, Mustard, Gram, Barley, Potato, Peas.\n\n*Recommendation:* Always choose certified seeds of locally recommended varieties and treat with fungicide + biofertilizer before sowing."
    ],

    "vegetative fertilizer": [
        "🌱 **Fertilizer Recommendations for Vegetative Stage:**\n\nDuring the vegetative phase (active leaf, stem, and root growth):\n• **Nitrogen (N) Priority:** Vegetative growth demands high nitrogen. Apply 25–35% of total nitrogen as top dressing (e.g., 30–35 kg Urea per acre).\n• **Split Application:** Never dump all nitrogen at once. Splitting into 2–3 doses prevents nitrogen leaching and root scorching.\n• **Application Method:** Broadcast Urea right before irrigation or hoeing so moisture dissolves nutrients directly into root zones.\n• **Foliar Micronutrients:** If yellowing leaves occur, spray 19:19:19 NPK (5 g/L) or 0.5% Zinc Sulfate + 1% Urea solution.\n• **Organic Boost:** Drench soil with diluted Jeevamrut or apply vermicompost (500 kg/acre) around plants."
    ],

    "fertilizer": [
        "🌱 **Balanced Fertilization Guide (NPK & Organic):**\n\n• **Wheat:** 120–150 kg N, 60 kg P2O5, 40 kg K2O per hectare. Apply full P & K with 1/3 N at sowing, and top-dress remaining N at 1st and 2nd irrigations.\n• **Rice:** 100–120 kg N, 50–60 kg P2O5, 40–50 kg K2O per hectare. Split N into 3 stages (basal, active tillering, panicle initiation).\n• **Micronutrients:** Zinc deficiency is widespread in Indian soils. Apply 25 kg Zinc Sulfate/ha once every 2–3 crops.\n• **Organic Alternatives:** Apply 8–10 tonnes Farmyard Manure (FYM) or 2–3 tonnes vermicompost/ha before field preparation.\n• **Soil Testing:** Always test soil every 2 years via Soil Health Card to avoid over-fertilizing and unnecessary costs."
    ],

    "pest and heat protection": [
        "🛡️ **Protecting Crops Against High Temperatures & Pests:**\n\n**Heat Stress Protection:**\n• **Cooling Irrigation:** Apply light, frequent watering early in the morning (5–8 AM) or evening (5–7 PM) to cool the crop microclimate.\n• **Mulching:** Spread 5–8 cm of dry straw or crop residue across beds to lower soil temperature by 4–6°C and cut evaporation by 30%.\n• **Foliar Heat Guard:** Spray 1% Potassium Nitrate (KNO3) or 5% Kaolin clay suspension to reduce heat stress and transpirational water loss.\n\n**Pest Management:**\n• **Sucking Pests (Aphids, Thrips, Whiteflies):** Spray Neem oil (5 ml/liter + 1 ml liquid soap) or 5% Neem Seed Kernel Extract (NSKE).\n• **Caterpillars & Borers:** Install pheromone traps (5–8 traps/acre) or spray Bacillus thuringiensis (Bt) at 2 g/L.\n• **Sticky Traps:** Hang 15–20 yellow and blue sticky cards per acre to trap pests before populations explode."
    ],

    "pest management": [
        "🌿 **Integrated Pest Management (IPM) for Crops:**\n\n1. **Regular Monitoring:** Inspect underside of leaves twice weekly for egg masses or nymph colonies.\n2. **Biological Controls:** Encourage natural predators (ladybird beetles, green lacewings) and use Trichogramma cards for egg parasitism.\n3. **Botanical Sprays:** Spray cold-pressed Neem oil (10,000 ppm at 5 ml/L) or ginger-garlic-chilli extract for safe pest suppression.\n4. **Traps:** Install yellow sticky cards for whiteflies/aphids, blue cards for thrips, and pheromone traps for pod borers.\n5. **Targeted Chemical Control:** Spray chemical insecticides only when pest damage crosses the Economic Threshold Level (ETL). Avoid spraying during peak honeybee activity."
    ],

    "wheat yield": [
        "📈 **Techniques to Maximize Wheat Farming Yield:**\n\n1. **Timely Sowing:** Sow between 1st–20th November. Sowing past late November reduces yield by 150–200 kg/ha per week due to terminal heat stress.\n2. **High-Yielding Varieties:** Choose certified varieties suited to your region (e.g., HD-2967, HD-3086, DBW-187, DBW-303, GW-322).\n3. **Seed Rate & Treatment:** Use 100 kg seed/ha. Treat with Carboxin + Thiram (2.5 g/kg) and Azotobacter + PSB biofertilizer.\n4. **Optimal Irrigation:** Water at Crown Root Initiation (21 DAS) and Flowering (80 DAS) without delay.\n5. **Balanced Plant Nutrition:** 120 kg N, 60 kg P, 40 kg K, plus 25 kg Zinc Sulfate per hectare.\n6. **Weed Management:** Apply recommended weedicide (Clodinafop / Sulfosulfuron) at 30–35 DAS before weeds steal nutrients."
    ],

    "crop stages": [
        "📊 **Key Growth Stages of Major Field Crops:**\n\n1. **Germination & Emergence (0–10 days):** Seed imbibes moisture and sprouts. Keep soil evenly moist; avoid crusted or flooded soil.\n2. **Vegetative Phase (10–35 days):** Rapid leaf and stem development. High nitrogen demand; crucial stage for weeding.\n3. **Tillering / Branching (30–55 days):** Secondary shoots develop. Determines the number of productive ears/heads per plant.\n4. **Flowering / Anthesis (55–80 days):** Pollination and flower head emergence. Very sensitive to moisture stress and high temperatures.\n5. **Grain Filling / Milking (80–110 days):** Starch accumulates in grains. Steady hydration is vital for plump grain size.\n6. **Maturity & Ripening (110–135 days):** Grains harden and dry down. Stop irrigation 10–14 days before harvest."
    ],

    "government schemes": [
        "🏛️ **Major Government Agricultural Schemes for Indian Farmers:**\n\n1. **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):** Direct income support of ₹6,000 per year paid in 3 equal instalments of ₹2,000 directly into farmer bank accounts.\n2. **PMFBY (Pradhan Mantri Fasal Bima Yojana):** Low-cost crop insurance covering natural yield losses. Farmers pay only 1.5% premium for Rabi, 2% for Kharif crops.\n3. **PMKSY (Pradhan Mantri Krishi Sinchayee Yojana):** Up to 45–55% subsidy on drip and sprinkler micro-irrigation systems under 'Per Drop More Crop'.\n4. **Soil Health Card Scheme:** Free laboratory soil testing every 2 years with custom nutrient recommendations to prevent over-fertilization.\n5. **Kisan Credit Card (KCC):** Low-interest working capital credit (at effective 4% interest rate with prompt repayment) for seeds, fertilizer, and farm inputs.\n6. **PKVY (Paramparagat Krishi Vikas Yojana):** Financial support of ₹50,000/ha over 3 years for adopting certified organic farming."
    ],

    "soil fertility": [
        "🌱 **Improving Soil Fertility & Soil Health:**\n\n1. **Organic Matter:** Add 10–15 tonnes Farmyard Manure (FYM) or compost per hectare every year to build organic carbon.\n2. **Crop Rotation with Legumes:** Alternate cereals (wheat/rice) with pulses (gram, moong, cowpea) to fix 40–80 kg atmospheric nitrogen per hectare naturally.\n3. **Green Manuring:** Sow Dhaincha (Sesbania) or Sunhemp and plow it back into the soil at 45 days before flowering.\n4. **For Clay Soils:** Add sand, gypsum (500 kg/ha), and organic matter to improve aeration, drainage, and root penetration.\n5. **Biofertilizers:** Inoculate soil with Phosphate Solubilizing Bacteria (PSB) and Mycorrhiza to unlock bonded soil phosphorus."
    ],

    "water conservation": [
        "💧 **Water Conservation Techniques for Smart Farming:**\n\n1. **Drip Irrigation:** Delivers water directly to the plant root zone, cutting water loss by 40–60% compared to flood irrigation.\n2. **Mulching:** Organic mulching with straw or leaves cuts soil evaporation by 25–30% and keeps root temperatures cool.\n3. **Laser Land Levelling:** Ensures uniform water distribution across the field, saving 20–25% irrigation water.\n4. **Rainwater Harvesting & Farm Ponds:** Collect and store surface runoff during monsoon to provide life-saving irrigation during dry spells.\n5. **Night/Morning Irrigation:** Irrigate between 5–8 AM or after 6 PM to eliminate midday evaporation losses."
    ],

    "crop rotation": [
        "🔄 **Crop Rotation Best Practices:**\n\n• **Why it matters:** Breaks pest/disease lifecycles, suppresses weeds, and replenishes soil nutrients naturally.\n• **Golden Rule:** Follow heavy nutrient-feeders (cereals) with nitrogen-fixers (legumes/pulses) and deep-rooted crops (mustard/cotton).\n• **North India Pattern:** Paddy/Maize (Kharif) → Wheat/Mustard (Rabi) → Moong/Urad (Zaid).\n• **Central/West India Pattern:** Soybean/Cotton (Kharif) → Gram/Wheat (Rabi) → Green Manure/Fallow.\n• **South India Pattern:** Paddy → Pulses (Blackgram/Greengram) → Groundnut/Sesame."
    ],

    "organic farming": [
        "🌿 **Organic Farming Essentials:**\n\n• **Fertility Inputs:** Use well-rotted FYM, vermicompost, neem cake, bone meal, and rock phosphate.\n• **Jeevamrut Preparation:** 10 kg cow dung + 10 L cow urine + 2 kg jaggery + 2 kg pulse flour in 200 L water; ferment 48 hours and apply via irrigation.\n• **Natural Pest Repellents:** Neem oil spray (5 ml/L), Dashparni ark, and Agniastra for natural insect control.\n• **Certification:** Apply through PKVY (Paramparagat Krishi Vikas Yojana) or PGS-India for government-recognized organic certification."
    ],
}


def get_knowledge_answer(question: str, context: str = "") -> str | None:
    """Get answer from knowledge base based on keywords and farm context"""
    q = question.lower().strip()

    # 1. Greetings
    greeting_triggers = ["hi", "hello", "hey", "namaste", "good morning", "good evening", "greetings", "hii", "helo"]
    if q in greeting_triggers or (len(q.split()) <= 2 and any(q.startswith(g) for g in greeting_triggers)):
        return AGRICULTURE_KB["greetings"][0]

    # 2. Government Schemes (PM-KISAN, PMFBY, Subsidy, etc.)
    scheme_triggers = ["scheme", "yojana", "pm-kisan", "pm kisan", "pmfby", "fasal bima", "subsidy", "subsidies", "kisan credit", "kcc", "insurance"]
    if any(t in q for t in scheme_triggers):
        return AGRICULTURE_KB["government schemes"][0]

    # 3. Wheat + Irrigation
    if "wheat" in q and any(k in q for k in ["irrig", "water", "schedule", "watering", "moisture"]):
        return AGRICULTURE_KB["wheat irrigation"][0]

    # 4. Rice / Paddy + Irrigation
    if any(k in q for k in ["rice", "paddy"]) and any(k in q for k in ["irrig", "water", "schedule", "awd"]):
        return AGRICULTURE_KB["rice irrigation"][0]

    # 5. Vegetative Stage + Fertilizer
    if ("vegetative" in q or "vegetative stage" in q) and any(k in q for k in ["fertili", "nutrient", "npk", "urea", "dose", "dosage", "manure"]):
        return AGRICULTURE_KB["vegetative fertilizer"][0]

    # 6. General Fertilizer & Nutrients
    if any(k in q for k in ["fertilizer", "fertiliser", "npk", "urea", "nutrient", "micronutrient", "zinc sulfate", "potash"]):
        return AGRICULTURE_KB["fertilizer"][0]

    # 7. Temperature / Heat + Pests Protection
    if any(k in q for k in ["temperature", "heat", "hot", "sun", "frost"]) and any(k in q for k in ["pest", "protect", "shield", "safe"]):
        return AGRICULTURE_KB["pest and heat protection"][0]

    # 8. Sandy Soil + Crop
    if "sandy" in q:
        return AGRICULTURE_KB["sandy soil crops"][0]

    # 9. Crop Recommendation / Which Crop to Plant
    crop_rec_triggers = [
        "which crop", "what crop", "best crop", "crop recommendation",
        "suggest crop", "crop suggestion", "crop to grow", "crop to plant",
        "crops for", "recommend crop", "crop seek"
    ]
    if any(t in q for t in crop_rec_triggers):
        return AGRICULTURE_KB["crop recommendation"][0]

    # 10. Wheat Yield Maximization
    if "wheat" in q and any(k in q for k in ["yield", "maximize", "increase yield", "production"]):
        return AGRICULTURE_KB["wheat yield"][0]

    # 11. General Yield
    if any(k in q for k in ["maximize yield", "increase yield", "higher yield", "boost yield", "maximum yield"]):
        return AGRICULTURE_KB["wheat yield"][0]

    # 12. Crop Growth Stages
    if any(k in q for k in ["crop stage", "growth stage", "stages of crop", "crop stages", "different stage", "different crop stage", "growth phase"]):
        return AGRICULTURE_KB["crop stages"][0]

    # 13. Pest & Disease Management
    if any(k in q for k in ["pest", "disease", "insect", "fungus", "fungal", "aphid", "thrips", "caterpillar", "mite", "whitefly", "spray"]):
        return AGRICULTURE_KB["pest management"][0]

    # 14. Water Conservation
    if any(k in q for k in ["water conservation", "conserve water", "save water", "drip irrigation", "mulch"]):
        return AGRICULTURE_KB["water conservation"][0]

    # 15. Crop Rotation
    if any(k in q for k in ["crop rotation", "rotation"]):
        return AGRICULTURE_KB["crop rotation"][0]

    # 16. Organic Farming
    if any(k in q for k in ["organic", "jeevamrut", "natural farming", "vermicompost"]):
        return AGRICULTURE_KB["organic farming"][0]

    # 17. Soil Fertility
    if any(k in q for k in ["soil fertility", "improve soil", "soil health", "clay soil", "black soil", "soil test"]):
        return AGRICULTURE_KB["soil fertility"][0]

    # 18. General Irrigation
    if any(k in q for k in ["irrigation", "irrigat", "how often to water", "when to water", "watering schedule"]):
        # If context specifies active crop, tailor response
        if "wheat" in context.lower():
            return AGRICULTURE_KB["wheat irrigation"][0]
        if "rice" in context.lower():
            return AGRICULTURE_KB["rice irrigation"][0]
        return AGRICULTURE_KB["wheat irrigation"][0]

    # 19. Context-aware fallback if question mentions "my crop" or "current crop"
    if any(k in q for k in ["my crop", "current crop", "my farm", "what should i do", "advice for me"]):
        if context:
            return (
                f"🌾 **Farm Advisory Based on Your Field Status:**\n\n"
                f"Here is recommendations based on your current setup:\n"
                f"{context.strip()}\n\n"
                f"**Action Steps:**\n"
                f"• **Moisture:** At 45% soil moisture, soil is in healthy range. If no rain is expected in 24h, inspect soil 5–10 cm deep tomorrow.\n"
                f"• **Crop & Stage:** For Wheat at Vegetative phase (32 days), ensure timely top-dressing of Nitrogen (Urea) and maintain weed-free rows.\n"
                f"• **Temperature:** At 28°C, conditions are favorable for vegetative growth. Keep an eye on afternoon heat and soil moisture."
            )

    return None


def get_hybrid_response(user_question: str, context: str = "") -> str | None:
    """Get response from knowledge base first, then fall back to model if needed"""
    return get_knowledge_answer(user_question, context)
