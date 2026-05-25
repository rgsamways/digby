export interface Lesson {
  slug: string;
  title: string;
  duration: string;
  intro: string;
  sections: { heading: string; body: string }[];
  tryIt?: string;
  linkLabel?: string;
  linkHref?: string;
  nextSlug?: string;
  prevSlug?: string;
}

export interface Track {
  id: "field" | "gis" | "prospector";
  title: string;
  tagline: string;
  colour: string;
  badge: string;
  lessons: Lesson[];
}

export const TRACKS: Track[] = [
  {
    id: "field",
    title: "Field Track",
    tagline: "No software. Five lessons. Know what you're looking at when you dig.",
    colour: "brand",
    badge: "5 min reads",
    lessons: [
      {
        slug: "1",
        title: "How Ontario's Geology Formed",
        duration: "5 min",
        intro:
          "Ontario sits on some of the oldest rock on Earth. Understanding how those rocks got here — " +
          "through collisions, magma chambers, and deep-sea sediments — tells you exactly where the " +
          "minerals are hiding today.",
        sections: [
          {
            heading: "Deep time",
            body:
              "The Canadian Shield, which covers most of Ontario, is between 1 and 4 billion years old. " +
              "To put that in perspective: the dinosaurs appeared about 230 million years ago. These rocks " +
              "predate complex animal life entirely.\n\n" +
              "Most of Ontario's bedrock formed when ancient continents collided, piling up mountains, " +
              "forcing molten rock upward, and metamorphosing (cooking and recrystallizing) existing rock " +
              "under enormous pressure and heat.",
          },
          {
            heading: "Where minerals come from",
            body:
              "Mineral deposits form in a few key situations:\n\n" +
              "**Magmatic intrusions** — when magma cools slowly deep underground, dense minerals " +
              "like magnetite, pyrite, and nickel sulphides crystallize out first and settle. " +
              "The Sudbury Basin formed when a meteorite impact re-melted the crust, concentrating " +
              "nickel, copper, and platinum group minerals.\n\n" +
              "**Hydrothermal fluids** — hot mineral-rich water moving through cracks in rock " +
              "deposits veins of quartz, calcite, pyrite, galena, and other minerals as it cools. " +
              "Most of Ontario's gold and silver came from hydrothermal systems.\n\n" +
              "**Pegmatites** — the last fluid fraction of a cooling granite body, pegmatites are " +
              "coarse-grained and carry rare elements in concentrated form: tourmaline, beryl, " +
              "spodumene, columbite, and gem-quality feldspar. Bancroft and Haliburton are " +
              "world-famous pegmatite districts.",
          },
          {
            heading: "The rock cycle in Ontario",
            body:
              "Ontario's rocks have been through multiple cycles. A rock that started as seafloor " +
              "sediment might have been metamorphosed into schist, intruded by granite, uplifted " +
              "into mountains, eroded back to sea level, buried again, and re-metamorphosed — " +
              "all in the last 2 billion years.\n\n" +
              "That complexity is why Ontario produces such diversity: gold, silver, nickel, copper, " +
              "uranium, iron, zinc, and a dizzying array of collector minerals in a relatively " +
              "small area.",
          },
        ],
        tryIt:
          "Open the Digby map and switch on the Bedrock geology layer. Click any coloured zone — " +
          "the popup tells you the rock type and approximate age. Find the oldest rock you can.",
        linkLabel: "Open the map",
        linkHref: "/map",
        nextSlug: "2",
      },
      {
        slug: "2",
        title: "Ontario's Four Geological Provinces",
        duration: "5 min",
        intro:
          "Ontario's rocks are divided into four geological provinces — regions that formed at " +
          "different times and under different conditions. Each province has its own mineral " +
          "character and its own signature collecting sites.",
        sections: [
          {
            heading: "Grenville Province (southeast and central Ontario)",
            body:
              "Formed 1.3–1.0 billion years ago in a mountain-building collision called the " +
              "Grenvillian Orogeny. The Grenville is pegmatite country — the intense heat and " +
              "pressure produced coarse-grained rocks rich in feldspar, mica, amphibole, and " +
              "rare minerals.\n\n" +
              "Bancroft is the heart of the Grenville for collectors. Expect sodalite, " +
              "uraninite, pyrochlore, columbite, titanite, and spectacular feldspar. The " +
              "region hosts more mineral species than almost anywhere else in Canada.",
          },
          {
            heading: "Superior Province (northwest Ontario)",
            body:
              "The Superior is among the oldest stable pieces of crust on Earth — mostly " +
              "2.7–3.0 billion years old. It's composed of ancient greenstone belts (seafloor " +
              "volcanic rock) intruded by granite domes.\n\n" +
              "The greenstone belts are gold country. The Timmins–Porcupine and Kirkland " +
              "Lake camps are among the most productive gold districts on the planet. " +
              "Pyrite, pyrrhotite, chalcopyrite, and native gold occur in quartz veins " +
              "cutting through dark volcanic rock.",
          },
          {
            heading: "Southern Province (north shore of Lake Huron)",
            body:
              "A belt of Proterozoic sedimentary and volcanic rocks (2.5–1.8 Ga) that " +
              "wraps around the north shore of Lake Huron. The famous Sudbury Igneous " +
              "Complex — the world's second-largest nickel deposit — sits at the margin " +
              "of the Southern Province.\n\n" +
              "Elliot Lake uranium deposits, copper, and massive sulphide deposits are " +
              "characteristic of this province.",
          },
          {
            heading: "Churchill Province (far north Ontario)",
            body:
              "The youngest and least-explored part of the Shield in Ontario — rocks " +
              "1.8–1.6 billion years old. Churchill Province hosts James Bay lowlands " +
              "and significant diamond, gold, and base metal potential.\n\n" +
              "Most of Churchill Province is accessible only by fly-in. Very little " +
              "recreational collecting happens here, but the mineral potential is enormous.",
          },
        ],
        tryIt:
          "On the Digby map, click the province names in the sidebar legend. Compare the " +
          "colour of sites in the Grenville vs. the Superior — notice how mineral types differ.",
        linkLabel: "Open the map",
        linkHref: "/map",
        prevSlug: "1",
        nextSlug: "3",
      },
      {
        slug: "3",
        title: "Reading Rocks — Minerals at Digby Sites",
        duration: "5 min",
        intro:
          "Knowing what to look for — and how to recognize it — turns a day of digging into a " +
          "genuinely educational hunt. These are the minerals you'll actually find at Ontario " +
          "pay-to-dig sites.",
        sections: [
          {
            heading: "Feldspar (the most common mineral you'll see)",
            body:
              "Feldspars make up more than half of Earth's crust. In Grenville pegmatites they " +
              "form large, pearly white to salmon-pink crystals. Two main types:\n\n" +
              "**Orthoclase / microcline** — potassium feldspar, often pink or salmon. " +
              "Amazon stone (green microcline) is a sought-after variety found in Ontario.\n\n" +
              "**Plagioclase** — calcium-sodium feldspar, typically white or grey, often " +
              "showing a blue shimmer (labradorescence) in labradorite.",
          },
          {
            heading: "Quartz and its varieties",
            body:
              "Quartz is the second most abundant mineral on Earth. In Ontario you'll find:\n\n" +
              "**Milky quartz** — white, found in veins throughout the Shield.\n\n" +
              "**Smoky quartz** — grey to dark brown, caused by natural radiation. " +
              "Common in Grenville pegmatites.\n\n" +
              "**Rose quartz** — pale pink, found at a handful of pegmatite sites.\n\n" +
              "**Rock crystal** — clear, hexagonal prisms up to several centimetres " +
              "in some Bancroft-area pegmatites.",
          },
          {
            heading: "Mica (the flashy ones)",
            body:
              "Micas cleave into thin flexible sheets and catch light brilliantly:\n\n" +
              "**Muscovite** — silver-white mica, very common in Grenville rocks.\n\n" +
              "**Biotite** — dark brown to black mica, equally common.\n\n" +
              "**Phlogopite** — golden-brown mica, found in marble bodies in the Grenville. " +
              "Ontario was once the world's leading phlogopite producer.",
          },
          {
            heading: "Amphiboles (the dark minerals)",
            body:
              "Hornblende and tremolite are the most common Ontario amphiboles — dark " +
              "elongated crystals in granitic and metamorphic rocks. Anthophyllite and " +
              "actinolite occur in some ultramafic bodies. If you see shiny black elongated " +
              "crystals in granite, they're almost certainly hornblende.",
          },
          {
            heading: "Tourmaline, apatite, and the rare finds",
            body:
              "At productive pegmatite sites you may encounter:\n\n" +
              "**Tourmaline** — black (schorl) or rarely coloured, hexagonal crystals " +
              "with striated faces.\n\n" +
              "**Apatite** — purple, blue, or green hexagonal crystals; several Ontario " +
              "sites are famous for gem apatite.\n\n" +
              "**Titanite (sphene)** — wedge-shaped yellow to brown crystals.\n\n" +
              "**Zircon** — tiny square-section crystals, usually in pegmatite or marble.",
          },
        ],
        tryIt:
          "Use the Digby AI Mineral Identifier to photograph something from your collection. " +
          "See if you can identify the crystal system before checking the result.",
        linkLabel: "Try the mineral identifier",
        linkHref: "/mineral-id",
        prevSlug: "2",
        nextSlug: "4",
      },
      {
        slug: "4",
        title: "Crown Land, Mineral Rights, and Site Access",
        duration: "5 min",
        intro:
          "Ontario has a surprisingly open land access system — but the rules are nuanced. " +
          "Understanding Crown land, free-mining rights, and private land rules keeps your " +
          "collecting legal and ethical.",
        sections: [
          {
            heading: "Who owns what",
            body:
              "Roughly 87% of Ontario's land area is Crown land (owned by the provincial " +
              "government). The rest is privately held or municipal.\n\n" +
              "Crown land in Ontario is managed under the Public Lands Act and the Mining Act. " +
              "Most unoccupied Crown land in Northern Ontario allows casual surface entry for " +
              "recreational purposes — you can hike and camp without a permit. However, " +
              "collecting minerals for commercial purposes without a mining claim is prohibited.",
          },
          {
            heading: "The Mining Act and mineral rights",
            body:
              "In Ontario, mineral rights are almost always separate from surface rights — a " +
              "landowner who bought farm property likely does not own the minerals below it. " +
              "The province issues mining claims through the Ontario Mining Lands Administration " +
              "System (MLAS).\n\n" +
              "For recreational collectors, the practical effect is: collecting on someone else's " +
              "mining claim without permission is illegal, even if it's Crown land. Mining claims " +
              "are registered and searchable through the Ontario Mineral Lands portal.",
          },
          {
            heading: "Private land and trespass",
            body:
              "Ontario's Trespass to Property Act makes entering private land without permission " +
              "a provincial offence. Farm fields, woodlots, and rural properties all require the " +
              "landowner's consent.\n\n" +
              "Digby sites are permission-granted — operators have either licensed their property " +
              "for public pay-to-dig access or hold the necessary authorizations. Booking through " +
              "Digby is your written permission record.",
          },
          {
            heading: "Parks and conservation areas",
            body:
              "Collecting is prohibited in all Ontario provincial parks and most conservation " +
              "authority lands. This includes Algonquin Provincial Park — even picking up loose " +
              "surface rocks is technically prohibited.\n\n" +
              "National parks (Parks Canada jurisdiction) have the same restriction. The only " +
              "exceptions are some Crown land areas managed for multiple uses.",
          },
          {
            heading: "Best practice",
            body:
              "Always book through Digby or get explicit written permission from landowners. " +
              "Keep your finds reasonable in volume (Ontario has no formal daily bag limit for " +
              "recreational collecting, but ethical collecting means not stripping a site). " +
              "Fill in pits you dig. Pack out all waste.",
          },
        ],
        tryIt:
          "Visit the Ontario Mining Lands portal (search: \"Ontario MLAS viewer\") and look up " +
          "a road near a known mineral area. You'll see mining claims as coloured polygons " +
          "overlaid on the map.",
        prevSlug: "3",
        nextSlug: "5",
      },
      {
        slug: "5",
        title: "Planning a Trip Using the Digby Map",
        duration: "5 min",
        intro:
          "The Digby map combines site discovery, geological context, and booking in one place. " +
          "Here's how to use it like a field geologist.",
        sections: [
          {
            heading: "Start with the bedrock layer",
            body:
              "Enable the Bedrock geology layer and zoom to a region you're considering visiting. " +
              "Look for Grenville Province colours (purple/violet) if you want pegmatite minerals. " +
              "Superior Province greenstone belts (blue) are best for quartz veins and sulphide " +
              "specimens. The contact zones between provinces are often the most interesting areas.",
          },
          {
            heading: "Cross-reference with mineral occurrences",
            body:
              "Toggle the Mineral occurrences layer (OGS MDI data). Each dot represents a " +
              "documented occurrence or historic mine from the Ontario Geological Survey. " +
              "Dense clusters indicate a productive mineral district.\n\n" +
              "Use the mineral filter input to narrow the layer to a specific species — " +
              "type \"apatite\" to see only apatite occurrences in Ontario.",
          },
          {
            heading: "Find Digby sites in geological context",
            body:
              "Green circles are active Digby sites. Click one to see the mineral list, " +
              "price, and a direct link to book. Cross-reference the site's geology: " +
              "a site showing high feldspar content on a Grenville pegmatite outcrop is " +
              "likely to also yield mica, tourmaline, and possibly apatite.",
          },
          {
            heading: "Past-producing mines as a field guide",
            body:
              "Toggle the Past producing mines layer. Historic mines are often near the best " +
              "collecting — not because you can collect at the mine (most are private or " +
              "hazardous), but because the geology that made the mine economic is the same " +
              "geology that produces collector specimens. Sites near historic mines often have " +
              "dump piles or country-rock float that's worth examining.",
          },
          {
            heading: "Booking and logistics",
            body:
              "Once you've chosen a site, click the site pin and follow the Book link directly " +
              "to the booking page. Check the site's availability calendar and the current " +
              "weather alerts (operators post conditions, flooding, or seasonal closures).\n\n" +
              "Consider the season: spring runoff makes many northern sites muddy or inaccessible " +
              "until late May. The best dry-ground window is typically late June through September.",
          },
        ],
        tryIt:
          "Plan a real trip: enable all four layers, find a Digby site in the Grenville Province " +
          "near a historic mine or mineral occurrence cluster, and check its availability. " +
          "Notice the bedrock type under the site.",
        linkLabel: "Open the map",
        linkHref: "/map",
        prevSlug: "4",
      },
    ],
  },
  {
    id: "gis",
    title: "GIS Track",
    tagline: "Five hands-on QGIS lessons using real Ontario geological survey data.",
    colour: "violet",
    badge: "QGIS required",
    lessons: [
      {
        slug: "1",
        title: "Installing QGIS and Loading Your First Ontario Geology Layer",
        duration: "10 min",
        intro:
          "QGIS is a free, open-source geographic information system used by professional " +
          "geologists worldwide. In this lesson you'll install QGIS, download an OGS bedrock " +
          "geology layer, and load it onto a map.",
        sections: [
          {
            heading: "Installing QGIS",
            body:
              "Download the Long Term Release (LTR) from qgis.org — choose the version labelled " +
              "\"LTR\" for stability. Install with default settings.\n\n" +
              "On Windows: run the installer, accept defaults, and launch \"QGIS Desktop\" from " +
              "the start menu.\n\n" +
              "On Mac: open the .dmg, drag QGIS to Applications, right-click → Open to bypass " +
              "Gatekeeper on first launch.",
          },
          {
            heading: "Downloading OGS geology data",
            body:
              "The Ontario Geological Survey publishes all its spatial data free at " +
              "geohub.lio.gov.on.ca. Search for \"Bedrock Geology of Ontario\".\n\n" +
              "Download the **Shapefile** version. You'll get a .zip with four files: " +
              ".shp (geometry), .dbf (attributes), .shx (index), .prj (projection). " +
              "Keep all four in the same folder.",
          },
          {
            heading: "Loading the layer in QGIS",
            body:
              "1. Open QGIS and start a new empty project (Project → New).\n" +
              "2. Click Layer → Add Layer → Add Vector Layer.\n" +
              "3. Navigate to your unzipped shapefile folder and select the .shp file.\n" +
              "4. Click Add. Ontario should appear as a coloured polygon layer.\n\n" +
              "QGIS assigns random colours by default. We'll style it properly in Lesson 3.",
          },
          {
            heading: "Understanding the attribute table",
            body:
              "Right-click the layer → Open Attribute Table. You'll see rows of data — " +
              "one row per polygon. Key columns:\n\n" +
              "**GEO_PROV** — geological province (Grenville, Superior, etc.)\n\n" +
              "**ROCK_TYPE** — broad rock classification (granite, metasediment, etc.)\n\n" +
              "**GEO_AGE** — approximate formation age\n\n" +
              "**FORMATION** — formal geological unit name\n\n" +
              "These are the field names you'll use in Lessons 2 and 3.",
          },
          {
            heading: "Setting the project CRS",
            body:
              "Ontario data is typically projected in NAD83 / UTM Zone 17N (EPSG:26917). " +
              "Check the bottom-right corner of QGIS for the current CRS. If it doesn't say " +
              "EPSG:26917, go to Project → Properties → CRS and search for 26917.\n\n" +
              "Using the correct CRS ensures distance measurements and area calculations " +
              "are accurate in metres, not degrees.",
          },
        ],
        tryIt:
          "With your bedrock layer loaded, zoom to the area around Bancroft, Ontario " +
          "(roughly 45.05°N, 77.85°W). Open the attribute table and click a row — " +
          "the corresponding polygon highlights on the map. Find three polygons in the " +
          "Grenville Province.",
        nextSlug: "2",
      },
      {
        slug: "2",
        title: "Querying and Filtering OGS Data",
        duration: "10 min",
        intro:
          "QGIS's query builder and selection tools let you filter millions of geological " +
          "records to find exactly what you're looking for — for example, all pegmatite " +
          "occurrences in Eastern Ontario.",
        sections: [
          {
            heading: "Using Select by Expression",
            body:
              "With the bedrock layer active, go to Edit → Select Features by Expression " +
              "(or press Ctrl+F3).\n\n" +
              "Type: `\"GEO_PROV\" = 'Grenville'` and click Select Features. All Grenville " +
              "Province polygons highlight in yellow. The selection count appears at the " +
              "bottom of the map.\n\n" +
              "To combine conditions: `\"GEO_PROV\" = 'Grenville' AND \"ROCK_TYPE\" ILIKE '%pegmatite%'`",
          },
          {
            heading: "Loading the Mineral Deposit Inventory (MDI)",
            body:
              "Download the Ontario Mineral Deposit Inventory from geohub.lio.gov.on.ca " +
              "(search: \"Mineral Deposits Ontario\"). This is a point layer — each point " +
              "is a documented occurrence.\n\n" +
              "Load it the same way as the bedrock layer. You'll see thousands of coloured " +
              "dots across Ontario.",
          },
          {
            heading: "Filtering the MDI by mineral",
            body:
              "Open the MDI attribute table. Find the column that stores mineral names " +
              "(commonly **COMMODITY** or **MINERAL**). The exact column name depends " +
              "on the OGS dataset version.\n\n" +
              "Expression to find apatite occurrences:\n" +
              "`\"COMMODITY\" ILIKE '%apatite%'`\n\n" +
              "After selecting, right-click the layer → Export → Save Selected Features As " +
              "to create a new layer with only your filtered results.",
          },
          {
            heading: "Spatial queries",
            body:
              "To find MDI occurrences that fall within Grenville Province bedrock:\n\n" +
              "1. Select Grenville polygons from the bedrock layer (step 1 above).\n" +
              "2. With the MDI layer active, go to Vector → Research Tools → " +
              "Select Within Distance (or use Select by Location).\n" +
              "3. Choose 'within' as the geometric predicate and select using the " +
              "bedrock layer selection.\n\n" +
              "This is the same operation GIS professionals use to plan exploration programs.",
          },
        ],
        tryIt:
          "Filter the MDI to show only occurrences where the commodity includes 'feldspar'. " +
          "Count how many fall within 50 km of Bancroft. Compare that count to 'apatite'.",
        prevSlug: "1",
        nextSlug: "3",
      },
      {
        slug: "3",
        title: "Symbolizing Rock Formations by Age or Type",
        duration: "10 min",
        intro:
          "Raw QGIS colours are random and meaningless. Professional geology maps use " +
          "standardized colours — lighter for younger, darker for older. In this lesson " +
          "you'll create a properly styled Ontario geology map.",
        sections: [
          {
            heading: "Categorized symbology",
            body:
              "Double-click the bedrock layer to open Layer Properties → Symbology. " +
              "Change the top dropdown from \"Single Symbol\" to \"Categorized\".\n\n" +
              "Set the Value column to **GEO_PROV**. Click Classify. QGIS generates one " +
              "colour per province. Click OK to preview.",
          },
          {
            heading: "Matching OGS province colours",
            body:
              "The OGS uses a consistent colour scheme across its publications:\n\n" +
              "- Grenville Province: warm purple/lavender\n" +
              "- Superior Province: cool blue\n" +
              "- Southern Province: green\n" +
              "- Churchill Province: amber/gold\n\n" +
              "Double-click each colour swatch in the symbol list to edit it. Enter hex " +
              "values: Grenville #c084fc, Superior #60a5fa, Southern #86efac, Churchill #fbbf24.",
          },
          {
            heading: "Rule-based symbology",
            body:
              "For finer control, switch to \"Rule-based\" symbology. You can write " +
              "expressions for each rule:\n\n" +
              "Rule 1: `\"GEO_PROV\" = 'Grenville' AND \"ROCK_TYPE\" ILIKE '%granite%'` " +
              "— light purple fill\n\n" +
              "Rule 2: `\"GEO_PROV\" = 'Grenville' AND \"ROCK_TYPE\" ILIKE '%marble%'` " +
              "— slightly different purple, as marble hosts different minerals\n\n" +
              "This level of differentiation helps identify the most mineralogically " +
              "interesting zones.",
          },
          {
            heading: "Adding labels",
            body:
              "Go to Layer Properties → Labels. Switch to \"Single Labels\" and set the " +
              "Label with value to **FORMATION**.\n\n" +
              "Set a minimum scale of 1:500,000 so labels only appear when zoomed in " +
              "enough to read them. Use a white buffer (halo) under Text → Buffer to " +
              "make labels legible over coloured polygons.",
          },
        ],
        tryIt:
          "Style the MDI point layer: categorize by commodity type. Use orange for gold, " +
          "yellow for uranium, green for copper, purple for rare earth elements. " +
          "Notice the spatial clusters.",
        prevSlug: "2",
        nextSlug: "4",
      },
      {
        slug: "4",
        title: "Intersecting Layers to Find Mineralizing Zones",
        duration: "10 min",
        intro:
          "Geologists find new deposits by combining multiple datasets — geology, geochemistry, " +
          "structural data, and known occurrences. This is what spatial intersection in GIS " +
          "is built for.",
        sections: [
          {
            heading: "What is a mineralizing zone?",
            body:
              "A mineralizing zone is where geological conditions favour mineral concentration: " +
              "a specific host rock type, proximity to an intrusion contact, a structural " +
              "feature that channeled fluids, and documented past occurrences in the same area.\n\n" +
              "By intersecting these datasets in GIS, you can rank areas by how many favourable " +
              "criteria they satisfy simultaneously.",
          },
          {
            heading: "Intersection with the Spatial Join tool",
            body:
              "Vector → Data Management Tools → Join Attributes by Location.\n\n" +
              "Join the MDI point layer (input) to the bedrock polygon layer (join). " +
              "Choose \"within\" as the predicate. This adds all bedrock attributes " +
              "(rock type, province, formation age) to each MDI occurrence point.\n\n" +
              "Now your occurrence points know what rock they sit on — you can filter " +
              "for 'apatite occurrences in Grenville marble' with a single expression.",
          },
          {
            heading: "Buffer analysis",
            body:
              "Mineralizing fluids travel along faults. To find occurrences near mapped faults:\n\n" +
              "1. Download the Ontario faults layer from geohub.lio.gov.on.ca.\n" +
              "2. Vector → Geoprocessing Tools → Buffer. Set distance to 5,000 m (5 km).\n" +
              "3. Use Select by Location to find MDI occurrences within the fault buffer.\n\n" +
              "A high density of known occurrences near faults indicates hydrothermal " +
              "mineralizing events — classic for gold and silver deposits.",
          },
          {
            heading: "Density mapping with heatmaps",
            body:
              "For a visual overview, apply a Heatmap renderer to the MDI layer " +
              "(Layer Properties → Symbology → Heatmap). Set radius to 25 km.\n\n" +
              "The hot zones on the heatmap are Ontario's historic mining districts — " +
              "Timmins, Kirkland Lake, Cobalt, Sudbury, Bancroft. These are exactly " +
              "where Digby sites cluster too.",
          },
        ],
        tryIt:
          "Run a spatial join between apatite MDI occurrences and the bedrock layer. " +
          "What percentage of Ontario's documented apatite occurrences are in Grenville Province? " +
          "The answer should be above 80%.",
        prevSlug: "3",
        nextSlug: "5",
      },
      {
        slug: "5",
        title: "From Map to Site — Planning a Digby Trip with Spatial Analysis",
        duration: "10 min",
        intro:
          "Everything you've learned — loading data, filtering, intersecting, and symbolizing — " +
          "comes together to plan a real collecting trip. We'll identify the geologically " +
          "richest accessible area within a day's drive of a starting city.",
        sections: [
          {
            heading: "Define your search area",
            body:
              "Create a point layer for your starting city (e.g., Toronto: -79.38°W, 43.65°N). " +
              "Buffer it by 250 km (a 2.5-hour drive): Vector → Geoprocessing → Buffer, 250000 m.\n\n" +
              "Clip your Ontario bedrock layer to this drive-distance polygon: " +
              "Vector → Geoprocessing → Clip.",
          },
          {
            heading: "Score geological richness",
            body:
              "Using the clipped area, count MDI occurrences per 25 km grid cell:\n\n" +
              "1. Vector → Research Tools → Create Grid (25 km hexagon or square cells).\n" +
              "2. Vector → Analysis → Count Points in Polygon — join MDI to the grid.\n" +
              "3. Style the grid by occurrence count (graduated colours, darker = more).\n\n" +
              "The highest-scoring cells are the most mineralogically documented areas " +
              "within your drive range.",
          },
          {
            heading: "Overlay Digby sites",
            body:
              "Load the Digby GeoJSON directly into QGIS: Layer → Add Layer → " +
              "Add Vector Layer → Protocol: HTTP(S) → enter the Digby map API URL.\n\n" +
              "Cross-reference site locations with your scored grid. Sites that fall in " +
              "high-scoring cells are likely in rich geological context even if the site " +
              "itself is smaller.",
          },
          {
            heading: "Export your planned route",
            body:
              "Once you've identified two or three sites to visit:\n\n" +
              "1. Create a new point layer and digitize your chosen sites.\n" +
              "2. Use the Print Layout (Project → New Print Layout) to export a PDF map " +
              "showing your route with the geology layer and site markers.\n\n" +
              "Take this offline map with you — cell service is unreliable north of Parry Sound.",
          },
          {
            heading: "Book through Digby",
            body:
              "Use the site IDs or names from your QGIS analysis to search Digby, " +
              "check availability, and book. Your spatial analysis gives you the geological " +
              "context that makes the booking decision — you know what you're heading into " +
              "before you arrive.",
          },
        ],
        tryIt:
          "Build the complete workflow: drive-distance buffer from your city → clip bedrock → " +
          "count MDI occurrences per grid → identify top 3 cells → find nearest Digby site " +
          "to each → book the best one.",
        linkLabel: "Browse Digby sites",
        linkHref: "/sites",
        prevSlug: "4",
      },
    ],
  },
  {
    id: "prospector",
    title: "Prospector Track",
    tagline: "The practical, legal, and boots-on-the-ground side of Ontario mineral rights. Written from lived experience — not a textbook.",
    colour: "amber",
    badge: "7 lessons",
    lessons: [
      {
        slug: "1",
        title: "Do I Need a Prospector's Licence?",
        duration: "5 min",
        intro:
          "There's a line in Ontario between collecting rocks for yourself and collecting rocks " +
          "to sell. Understanding which side of that line you're on — and what the legal " +
          "consequences are — is the first thing any serious rockhound needs to know.",
        sections: [
          {
            heading: "The difference nobody tells you about",
            body:
              "There's a line in Ontario between collecting rocks for yourself and collecting " +
              "rocks to sell. On one side of that line you're a hobbyist. On the other side " +
              "you're a commercial operator, and the rules are completely different.\n\n" +
              "A hobbyist picking up a few specimens on Crown Land for their personal collection " +
              "exists in a grey area that's generally tolerated. Nobody is going to stop you " +
              "from putting an interesting piece of feldspar in your pocket on a backcountry hike.\n\n" +
              "But the moment you're systematically collecting material to sell — in a subscription " +
              "box, in a shop, at a show — you're in commercial territory. That changes your legal " +
              "exposure significantly. Conservation officers and the Ministry of Mines treat those " +
              "two situations very differently.",
          },
          {
            heading: "Provincial Parks — full stop",
            body:
              "If you're thinking about collecting in a Provincial Park, don't. It's completely " +
              "prohibited, full stop. No collecting of any kind, personal or commercial. " +
              "Killarney, Algonquin, Frontenac — all off limits. Fines are real and enforcement " +
              "happens, especially at known mineral localities.",
          },
          {
            heading: "Crown Land",
            body:
              "Most of Ontario's backcountry is Crown Land. Surface collecting for personal " +
              "use is generally tolerated but technically requires a prospector's licence for " +
              "anything beyond casual surface picking. For commercial collection you need proper " +
              "authorization — and that starts with a prospector's licence.",
          },
          {
            heading: "Private Land",
            body:
              "Simple — trespassing charges if you don't have permission. Always get written " +
              "permission from the landowner before setting foot on private land for any " +
              "collecting purpose.",
          },
          {
            heading: "The clean path",
            body:
              "Here's what I decided: buy wholesale from licensed local suppliers. Let them " +
              "worry about sourcing. I buy legitimately, my hands are clean, and I get to focus " +
              "on curation and storytelling instead of legal exposure.\n\n" +
              "That's not giving up — it's the right business decision at this stage. As Digby " +
              "grows and my prospector's licence is in hand, direct collecting becomes an option. " +
              "But launching Strata on legally questionable material would be a terrible foundation " +
              "for a platform built around responsible rockhounding.",
          },
          {
            heading: "So do you need a licence?",
            body:
              "If you're collecting for yourself — probably not immediately, but it's worth " +
              "getting anyway.\n\n" +
              "If you're collecting to sell — yes, absolutely, before you collect a single " +
              "piece commercially.\n\n" +
              "The licence itself is straightforward. An online course called the MAAP " +
              "(Mining Act Awareness Program) takes about an hour. Then you register with the " +
              "province and pay a small fee. The whole thing can be done from home in an afternoon.\n\n" +
              "We'll walk through exactly how to do that in Lesson 6.",
          },
        ],
        tryIt:
          "Think through your own situation: are you collecting for yourself, or do you intend " +
          "to sell? If there's any commercial intent — even a future plan to sell — that's the " +
          "side of the line that requires a licence. Search for the MAAP (Mining Act Awareness " +
          "Program) on ontario.ca and look at the module list. It takes about an hour and is " +
          "required before you can register.",
        nextSlug: "2",
      },
      {
        slug: "2",
        title: "Reading the MLAS Map",
        duration: "6 min",
        intro:
          "The Ontario government's free Mining Lands Administration System shows every " +
          "mining claim in the province overlaid on a topographic map. If you want to " +
          "understand what land is available to stake — or just who already holds what — " +
          "this is where you start.",
        sections: [
          {
            heading: "The colours",
            body:
              "The first thing you notice is pink. Lots of pink. Pink means staked — someone " +
              "holds a mining claim on that land. In the Bancroft area, which is one of the " +
              "most mineralogically rich regions in Canada, you'll find a lot of pink.\n\n" +
              "What you're looking for is the absence of pink. Unshaded cells are open Crown " +
              "Land potentially available for staking.",
          },
          {
            heading: "The grid",
            body:
              "Ontario's mining land is divided into a provincial grid of cells. Each cell " +
              "has a reference number — something like 31F04E063. That number is how claims " +
              "are identified, recorded, and staked. When you find an open cell you want, " +
              "that's the number you'll use.",
          },
          {
            heading: "The layers",
            body:
              "The map has several layers you can toggle. The ones that matter most to " +
              "new prospectors:\n\n" +
              "**Mining Claim** — shows active staked claims. This is what creates the pink overlay.\n\n" +
              "**Mining Claim Number** — labels each claimed cell with its reference number.\n\n" +
              "**Alienation** — shows private land parcels. This is critical. Private land and Crown " +
              "Land look similar on a basic map but are completely different legally. The Alienation " +
              "layer lets you see exactly where private property boundaries are.\n\n" +
              "**Mining Division** — shows which administrative division your area falls under. " +
              "Relevant when you're ready to stake.",
          },
          {
            heading: "The 'I want to' menu",
            body:
              "Top left of the screen. Your most useful options:\n\n" +
              "**Find data on the map** — tap or click any cell to see its full details. Status, " +
              "claim holder, expiry date, coordinates. This is how you investigate a cell before " +
              "getting excited about it.\n\n" +
              "**Find a MEM Township or Area** — search by township name to navigate to a " +
              "specific area. If you know you're in Herschel Township, type it in and the map " +
              "centres there instantly.\n\n" +
              "**Find a Grid Cell** — search by cell number if you already know what you're " +
              "looking for.",
          },
          {
            heading: "What to look for",
            body:
              "When you find an unshaded cell, tap it immediately. Don't assume it's open just " +
              "because there's no pink. The identify results will tell you the cell's status " +
              "code — and that's where it gets interesting.\n\n" +
              "Available with no reason code is what you want. Anything else needs further " +
              "investigation before you get attached to a cell. We cover status codes in " +
              "detail in Lesson 3.",
          },
          {
            heading: "One thing I learned the hard way",
            body:
              "The map works much better on a desktop browser than on a phone. On desktop " +
              "you can click individual cells precisely and get clean identify results. On " +
              "mobile the tap targets are small and the identify function can be finicky.\n\n" +
              "Do your serious MLAS research at a computer. Use your phone in the field to " +
              "cross-reference what you already know.",
          },
        ],
        tryIt:
          "Open the MLAS Map Viewer (ontario.ca → search 'Mining Lands Administration System' " +
          "→ scroll to Map Viewer). Navigate to Herschel Township near Bancroft. Enable the " +
          "Mining Claim layer and the Alienation layer together. Notice where private land " +
          "and Crown Land interleave — this is the landscape you'd be working with.",
        linkLabel: "Cross-reference on Digby map",
        linkHref: "/map",
        prevSlug: "1",
        nextSlug: "3",
      },
      {
        slug: "3",
        title: "Understanding Cell Status Codes",
        duration: "5 min",
        intro:
          "You found an open cell. No pink overlay, no red border. You clicked it and the " +
          "identify results came back. Now what? The two fields that matter most are " +
          "CELL_STATUS_CODE and CELL_REASON_CODE — and knowing what they mean can save " +
          "you a rejected staking application.",
        sections: [
          {
            heading: "CELL_STATUS_CODE",
            body:
              "This is the top-level answer.\n\n" +
              "**A — Available.** The cell is open for staking. This is what you want to see.\n\n" +
              "**S — Staked.** Someone holds this cell. Move on.\n\n" +
              "**W — Withdrawn.** The province has pulled this land from staking for " +
              "administrative or policy reasons.\n\n" +
              "There are other codes but these are the three you'll encounter most often.",
          },
          {
            heading: "CELL_REASON_CODE",
            body:
              "This is where it gets interesting. A cell can be status A — Available — " +
              "and still have a reason code attached that tells you there are complications. " +
              "This caught me off guard the first time.\n\n" +
              "The code you're most likely to encounter is **C — Known Restrictions.**\n\n" +
              "A Code C doesn't mean the cell is blocked. It means stake carefully and do " +
              "your homework first. There are three common reasons a cell gets a C:\n\n" +
              "**Withdrawals** — the land is under a temporary hold due to an ongoing review, " +
              "land-use planning, or a public safety matter. May clear in time. Worth calling " +
              "the Provincial Recording Office to ask.\n\n" +
              "**Prior Claims** — parts of the cell contain overriding or pre-existing " +
              "dispositions — an old lease fragment, a prior claim that wasn't fully cleared. " +
              "Prevents a standard cell claim from being registered over top.\n\n" +
              "**Size/Boundary Limitations** — the usable area of the cell falls below 25 " +
              "hectares, usually because private land parcels eat into it. This is the most " +
              "common reason in settled areas like Herschel Township where private land and " +
              "Crown Land are interleaved.",
          },
          {
            heading: "What I found",
            body:
              "The first open cell I identified near my property — 31F04E063 — came back " +
              "Available with a Code C. Given how much private land surrounds my property, " +
              "the size/boundary limitation is the most likely explanation. The cell simply " +
              "may not have enough Crown Land remaining to constitute a valid claim.\n\n" +
              "The cell I found further into the bush — 31E01H057 — came back clean. " +
              "Available, no reason code. That's the one worth pursuing.",
          },
          {
            heading: "When you get a Code C",
            body:
              "Don't stake and hope for the best. Call the Provincial Recording Office " +
              "directly and ask about the specific cell. They'll tell you exactly what the " +
              "restriction is and whether there's a path forward.\n\n" +
              "Provincial Recording Office: **1-888-415-9845**\n" +
              "Email: pro.ndm@ontario.ca\n\n" +
              "Five minutes on the phone saves you the frustration of a rejected " +
              "staking application.",
          },
          {
            heading: "The bottom line",
            body:
              "Available with no reason code — stake it.\n" +
              "Available with Code C — investigate before staking.\n" +
              "Anything else — move on and find another cell.",
          },
        ],
        tryIt:
          "On the MLAS map, find two adjacent open cells near a known mineral area. Click each " +
          "one and compare the CELL_STATUS_CODE and CELL_REASON_CODE fields. If either shows " +
          "Code C, think through which of the three restriction types is most likely given " +
          "the surrounding land use.",
        prevSlug: "2",
        nextSlug: "4",
      },
      {
        slug: "4",
        title: "Ground Truthing — Why You Always Visit Before You Stake",
        duration: "7 min",
        intro:
          "A map dot is not a mineral deposit. It's a rumour. The MLAS map, the OGS mineral " +
          "inventory, the historical records — they're all valuable research tools. But none " +
          "of them tell you what's actually on the ground today. Only your boots can do that.",
        sections: [
          {
            heading: "The Hound Lake lesson",
            body:
              "I found a documented graphite occurrence a few minutes from my house. " +
              "MDI31E01NE00012 — the Hound Lake graphite prospect. Historical work going back " +
              "to 1912. An adit driven into the rock. Wartime testing in 1942. A junior " +
              "exploration company running geophysics in 1989. Three separate groups across " +
              "77 years thought this deposit was worth investigating.\n\n" +
              "I got excited. Naturally.\n\n" +
              "So I drove out to have a look.\n\n" +
              "What I found was an impenetrable wall of blowdown from a recent ice storm. " +
              "Overgrowth everywhere. Barely a rock in sight. I was standing roughly halfway " +
              "between Dog Bay Road and the actual documented coordinates — and the terrain " +
              "was telling me clearly that this wasn't the day.",
          },
          {
            heading: "What went wrong — and what didn't",
            body:
              "A few things to unpack from that experience.\n\n" +
              "First — I wasn't even at the right coordinates. The occurrence is named after " +
              "Hound Lake but it's not at the lake. It's further west. The AMIS record has " +
              "the precise coordinates: 45°08'49.9\"N 78°01'41.8\"W. I was navigating by " +
              "general knowledge of the area rather than plugging those exact coordinates " +
              "into my GPS. Lesson learned.\n\n" +
              "Second — the ice storm damage is recent. That kind of blowdown changes terrain " +
              "significantly and temporarily. The adit is still there somewhere under 40 years " +
              "of vegetation and a season of fallen trees. It hasn't gone anywhere. This is a " +
              "return trip, not an abandoned lead.\n\n" +
              "Third — and most importantly — I found this out before staking. If I'd paid " +
              "the staking fee and filed the claim based on the map dot alone, I'd have a " +
              "claim on land I can't currently access and haven't verified. That's money and " +
              "effort wasted.",
          },
          {
            heading: "What ground truthing actually means",
            body:
              "Before you stake any cell, visit it. On foot if possible. You're looking " +
              "for several things:\n\n" +
              "**Access** — can you actually get there? Is there a road, a trail, a reasonable " +
              "bushwhack? A claim you can't access is worthless.\n\n" +
              "**Terrain** — what does the land actually look like? Wetland and muskeg mean " +
              "deep overburden and no surface collecting. Rocky upland with exposed outcrops " +
              "is what you want.\n\n" +
              "**Outcrop** — is there exposed bedrock? In the Bancroft area you're looking " +
              "for the rocky high ground, the ridges, the hillsides. That's where " +
              "mineralization surfaces.\n\n" +
              "**Evidence of historical work** — old trenches, pits, waste rock piles, adit " +
              "entrances. These are often subtle after decades of growth but they tell you " +
              "exactly where previous prospectors focused their attention. Find the old work " +
              "and you've found the target.\n\n" +
              "**Practical logistics** — how far is it from a road? What's the seasonal access " +
              "like? Can you work it in winter? These questions matter if you're planning " +
              "regular visits.",
          },
          {
            heading: "Use every tool before you go",
            body:
              "Ground truthing doesn't start when you park the truck. It starts at your desk.\n\n" +
              "Before visiting any cell I now look at it three ways:\n\n" +
              "The MLAS map for claim status and grid reference. The Digby geology map for " +
              "bedrock formation, mineral occurrences, and what's been documented in the area. " +
              "Google Maps satellite view for terrain — you can see wetlands, rocky outcrops, " +
              "road access, and land cover before you leave the house.\n\n" +
              "Those three tools together give you a strong picture of what you're walking " +
              "into. The boots on the ground are the final confirmation, not the first step.",
          },
          {
            heading: "The bottom line",
            body:
              "The map told me there was a documented graphite deposit with an adit a few " +
              "minutes from my house. The ground told me it wasn't accessible today. Both " +
              "of those things are true and useful.\n\n" +
              "I didn't waste a staking fee. I know where to go back when conditions improve. " +
              "And I learned more about how to use coordinates properly and what to look for " +
              "when I get there.\n\n" +
              "That's what ground truthing is — turning a map rumour into real knowledge, " +
              "one visit at a time.",
          },
        ],
        tryIt:
          "Pick an open cell on the MLAS map near a documented mineral occurrence. Before " +
          "physically visiting, do the full desk research: check the Digby geology map for " +
          "formation and nearby occurrences, then pull up satellite view for the same " +
          "coordinates. How accessible does it look? What's the terrain like? What would " +
          "you be hoping to find on the ground?",
        linkLabel: "Open Digby geology map",
        linkHref: "/map",
        prevSlug: "3",
        nextSlug: "5",
      },
      {
        slug: "5",
        title: "Finding and Researching Historical Mineral Occurrences",
        duration: "8 min",
        intro:
          "Ontario has been prospected for over 150 years. Thousands of mineral occurrences " +
          "have been documented, tested, abandoned, and forgotten. Most of them are sitting " +
          "in government databases right now, free to access, waiting for someone to look them up.",
        sections: [
          {
            heading: "The Ontario Mineral Inventory",
            body:
              "The Ontario Geological Survey maintains a database called the OMI — Ontario " +
              "Mineral Inventory, previously known as the MDI or Mineral Deposit Inventory. " +
              "You may see both names used; they refer to the same database. Every documented " +
              "mineral occurrence in the province has an OMI number. When you see an orange " +
              "dot on the Digby geology map, that dot has an OMI number behind it.\n\n" +
              "You access it through the Ontario government's geology portal — search for " +
              "**GeologyOntario** on ontario.ca, or go directly to " +
              "data.ontario.ca/dataset/mineral-deposit-inventory-of-ontario to find the " +
              "current search link. Search by OMI number or by township name.\n\n" +
              "The OMI record for any occurrence tells you:\n" +
              "— What mineral or commodity was found\n" +
              "— Where exactly it is — township, lot, concession, and UTM coordinates\n" +
              "— What physical features exist — adit, trench, pit, shaft, outcrop\n" +
              "— The complete work history — who did what and when",
          },
          {
            heading: "Reading a work history",
            body:
              "The work history is where the story is. Let me show you what I mean using a " +
              "real example — the Hound Lake graphite occurrence, MDI31E01NE00012, a few " +
              "minutes from my house in Herschel Township.\n\n" +
              "**1912-1913: W. Wallace, J. Wallace and E. Woolton — pitting, trenching, adit.**\n\n" +
              "This was the height of Ontario's graphite boom. The Wallace crew wasn't just " +
              "poking around — they dug test pits, cut trenches to expose the vein, and drove " +
              "a horizontal tunnel into the rock. That level of work in 1912 means they found " +
              "something worth pursuing. An adit takes real effort and money to drive. They " +
              "believed in this deposit.\n\n" +
              "**1942: Testing of flake graphite.**\n\n" +
              "Wartime. Graphite was a critical war material in 1942 — used in munitions, " +
              "lubricants, and reactor moderators. Someone specifically tested this deposit " +
              "for flake graphite quality during the Second World War. Flake graphite is the " +
              "premium grade — the kind used in lithium-ion batteries and electric vehicles " +
              "today. The fact that it was tested at all tells you the graphite here is " +
              "the right type.\n\n" +
              "**1989: Harrington Sound Resources Inc. — mapping, prospecting, sampling, " +
              "ground geophysics.**\n\n" +
              "A junior exploration company came in with modern methods. Ground geophysics " +
              "means they ran electromagnetic or magnetic surveys to map the subsurface extent " +
              "of the graphite zone. This isn't a hobbyist with a rock hammer — this is a real " +
              "exploration program. They spent money here.\n\n" +
              "Three independent groups across 77 years. All of them thought this deposit was " +
              "worth investigating.",
          },
          {
            heading: "What the work history tells you",
            body:
              "Each type of historical work tells you something specific:\n\n" +
              "**Pitting and trenching** — surface exploration. They were trying to trace a " +
              "vein or zone along strike. Tells you the mineralization is near surface and " +
              "they were mapping its extent.\n\n" +
              "**Adit** — horizontal tunnel driven into a hillside. Tells you the deposit has " +
              "some depth and the prospectors thought it warranted underground investigation.\n\n" +
              "**Shaft** — vertical excavation. More serious than an adit. Significant investment.\n\n" +
              "**Geophysics** — modern survey techniques. Tells you a company was serious enough " +
              "to spend real money on instrumentation. Their filed reports often contain maps " +
              "and data you can use.\n\n" +
              "**Sampling and assay** — they took rock samples and had them chemically analyzed. " +
              "If assay results are in the record they tell you grades and whether the " +
              "mineralization is economic.",
          },
          {
            heading: "The AMIS database",
            body:
              "For occurrences with historical mine workings — adits, shafts, trenches — " +
              "there's a companion database called AMIS, the Abandoned Mines Information " +
              "System. The Hound Lake occurrence has an AMIS record: 07760.\n\n" +
              "AMIS records often contain additional detail about the physical features — " +
              "precise coordinates of the adit entrance, dimensions of the workings, safety " +
              "status. The Hound Lake AMIS record gave me the exact coordinates I needed: " +
              "45°08'49.9\"N 78°01'41.8\"W — different from the OMI coordinates, and much " +
              "more precise.\n\n" +
              "Always check both databases for any occurrence with historical workings.",
          },
          {
            heading: "Assessment files — the hidden goldmine",
            body:
              "When an exploration company holds a mining claim in Ontario, they're required " +
              "to file assessment reports documenting their work. Those reports are public " +
              "record and are stored in the Ontario Assessment File system, also accessible " +
              "through GeologyOntario.\n\n" +
              "The 1989 Harrington Sound Resources work on Hound Lake would have generated " +
              "assessment reports. Those reports likely contain their geophysical survey maps, " +
              "sample locations, assay results, and — most usefully — their conclusions about " +
              "why they stopped.\n\n" +
              "Knowing why a company walked away from a deposit is as valuable as knowing why " +
              "they went in.\n\n" +
              "To find assessment files: GeologyOntario → Assessment Files → search by " +
              "township and date range.",
          },
          {
            heading: "A note on coordinates",
            body:
              "Historical OMI records often use the centre of the lot and concession as the " +
              "occurrence location — not the precise location of the adit or trench. Always " +
              "cross-reference with the AMIS record if one exists, and always plug the exact " +
              "coordinates into your GPS before visiting.\n\n" +
              "I made the mistake of navigating to the general area of Hound Lake rather than " +
              "the precise AMIS coordinates. The occurrence is named after the lake but it's " +
              "not at the lake — it's several hundred metres further west. Exact coordinates matter.",
          },
          {
            heading: "Putting it all together",
            body:
              "Before visiting any documented occurrence I now build a research file:\n\n" +
              "1. Look up the OMI record — what's there, what was found, full work history\n" +
              "2. Check for an AMIS record — precise coordinates, physical features, safety notes\n" +
              "3. Search assessment files for any filed reports — especially geophysics and " +
              "sampling data\n" +
              "4. Cross-reference on the Digby geology map — what formation is it in, what " +
              "else is documented nearby\n" +
              "5. Check satellite view — what does the terrain actually look like\n\n" +
              "That research takes an hour at a desk and tells you more than a day of " +
              "uninformed bushwhacking.\n\n" +
              "The historical prospectors did the hard work of finding these occurrences. " +
              "Your job is to find their work, understand what they knew, and figure out " +
              "what they missed.",
          },
        ],
        tryIt:
          "Open the Digby geology map and click any orange occurrence dot near Bancroft. " +
          "Note the OMI number in the popup. Then go to GeologyOntario (search ontario.ca for " +
          "'GeologyOntario') and look up that number. Read the work history. What types of " +
          "work were done? How many groups investigated it? Does an AMIS record exist?",
        linkLabel: "Open Digby geology map",
        linkHref: "/map",
        prevSlug: "4",
        nextSlug: "6",
      },
      {
        slug: "6",
        title: "Staking a Claim — The Actual Process Step by Step",
        duration: "7 min",
        intro:
          "Everything in the previous lessons has been leading here. You've found an open " +
          "cell. You've checked the status codes. You've visited the land and confirmed it's " +
          "worth pursuing. Now you stake it. Here's exactly how.",
        sections: [
          {
            heading: "Step 1 — Get your prospector's licence",
            body:
              "You cannot stake a claim without a valid Ontario prospector's licence. " +
              "There are no shortcuts here.\n\n" +
              "Complete the MAAP — the Mining Act Awareness Program — at " +
              "mlas.mndm.gov.on.ca/maapp/en. It's a free online course, about an hour, " +
              "covering the Mining Act, Aboriginal and treaty rights, private landowner rights, " +
              "and early exploration requirements. You must complete it within 60 days before " +
              "applying for your licence.\n\n" +
              "Create an Ontario.ca Login account and register as an MNDM client to get your " +
              "Client Number and PIN.\n\n" +
              "Log into MLAS and purchase your licence electronically. It's renewed every " +
              "five years, and you must retake the MAAP each time.\n\n" +
              "The whole process can be done from home in an afternoon. Do it before you do " +
              "anything else.",
          },
          {
            heading: "Step 2 — Confirm the cell is open",
            body:
              "You've already done this in Lessons 2 and 3. But check again immediately " +
              "before staking — claims can be registered at any time and the map updates " +
              "regularly. A cell that was open last week may not be open today.\n\n" +
              "Log into MLAS, find your cell, confirm the status is A with no reason code. " +
              "Then move fast.",
          },
          {
            heading: "Step 3 — Register the claim online through MLAS",
            body:
              "Ontario moved to online cell staking in 2013. You no longer physically post " +
              "a claim in the field — everything is done electronically through MLAS.\n\n" +
              "Log into your MLAS account. Navigate to the cell you want to stake. Select " +
              "it and follow the registration process. You'll pay the staking fee online — " +
              "currently $40 CAD per cell.\n\n" +
              "Once registered the claim appears on the MLAS map immediately. It's yours.",
          },
          {
            heading: "Step 4 — Understand what you now have",
            body:
              "A staked mining claim gives you the right to explore for minerals on that cell. " +
              "It does not give you surface rights on private land within the cell. It does " +
              "not give you the right to extract and sell minerals without further licensing. " +
              "It does not mean you own the land.\n\n" +
              "What it does give you: the exclusive right to conduct early exploration " +
              "activities on that cell, and the first right to convert the claim to a lease " +
              "if you find something economic.\n\n" +
              "Early exploration activities include prospecting, geological mapping, " +
              "geophysical surveys, and limited ground disturbance. More invasive work " +
              "requires additional permits and Aboriginal consultation.",
          },
          {
            heading: "Step 5 — File assessment work",
            body:
              "To keep your claim active you must perform assessment work and file reports " +
              "with the province every year. The minimum assessment work requirement is " +
              "currently $400 CAD worth of work per cell per year — this can include your " +
              "own labour at a prescribed rate, not just contractor costs.\n\n" +
              "If you don't file assessment work your claim lapses. That's how cells become " +
              "available again — previous holders stop filing and the claim reverts to " +
              "open status.\n\n" +
              "Assessment work reports are filed through MLAS and become part of the public " +
              "record. Future prospectors will be able to read your reports someday.",
          },
          {
            heading: "What I'm doing next",
            body:
              "Complete the MAAP. Get the licence. Call the Provincial Recording Office about " +
              "cell 31E01H057 — the clean available cell I found in the bush near my house — " +
              "to confirm it's straightforwardly stakeable. Then stake it.\n\n" +
              "When I've been through the full staking process I'll update this lesson with " +
              "the actual experience — what the MLAS interface looks like, how long it takes, " +
              "what happens immediately after.\n\n" +
              "Check back.",
          },
        ],
        tryIt:
          "Walk through the MLAS account creation process without going all the way to staking. " +
          "Create your Ontario.ca Login, find the MNDM client registration, and look at the " +
          "MAAP course overview. Knowing the system before you need it means you can move " +
          "quickly when you find the right cell.",
        prevSlug: "5",
        nextSlug: "7",
      },
      {
        slug: "7",
        title: "Working with Private Landowners",
        duration: "6 min",
        intro:
          "In the Bancroft area, private land and Crown Land are woven together in a patchwork " +
          "that can be hard to read from a map alone. Understanding how to work with private " +
          "landowners isn't optional — it's foundational to doing this right.",
        sections: [
          {
            heading: "Why landowners matter",
            body:
              "Ontario separates surface rights from mineral rights. A landowner who holds the " +
              "deed to their property controls the surface — the trees, the buildings, the " +
              "access. But the mineral rights beneath that surface may belong to the Crown, " +
              "to a mining claim holder, or to the landowner themselves depending on when the " +
              "land was patented and under what terms.\n\n" +
              "This means two things:\n\n" +
              "First — a mining claim on cells that overlap private land does not give you " +
              "the right to walk onto that land without permission. You need surface access " +
              "rights from the landowner regardless of what the MLAS map says about " +
              "mineral tenure.\n\n" +
              "Second — many private landowners in the Bancroft area are sitting on " +
              "mineralogically interesting land and have no idea. The OGS has documented " +
              "occurrences on and near private properties all through Herschel, Monteagle, " +
              "and the surrounding townships. That's an opportunity.",
          },
          {
            heading: "The wrong approach",
            body:
              "Showing up unannounced, assuming access because you have a mining claim, being " +
              "vague about what you're doing, or treating the landowner as an obstacle. Any " +
              "of these will close doors permanently — not just for you, but potentially for " +
              "the digby community you're trying to build.",
          },
          {
            heading: "The right approach",
            body:
              "Introduce yourself honestly. Explain what you're looking for and why. Be " +
              "specific about what access you're asking for — a single visit, regular access, " +
              "what areas you want to look at. Offer something in return.\n\n" +
              "The conversation I'd have:\n\n" +
              "\"I run a platform called digby.rocks — it's a booking site for rockhound sites " +
              "across Ontario. I'm also a prospector working on a personal claim in the area. " +
              "I've noticed from the provincial geology records that there may be some " +
              "interesting mineralization on or near your property. I'd love to have a look " +
              "if you're open to it — happy to share anything I find with you and to " +
              "acknowledge your land in whatever I publish.\"\n\n" +
              "That's honest, specific, and offers value. Most landowners in rural Ontario " +
              "are curious about what's on their land. You're offering them knowledge they " +
              "don't have.",
          },
          {
            heading: "What to put in writing",
            body:
              "If a landowner says yes, get it in writing. A simple letter or email confirming:\n\n" +
              "— Who has permission to access\n" +
              "— What areas they can access\n" +
              "— What activities are permitted — walking, sampling, digging\n" +
              "— The time period the permission covers\n" +
              "— That you'll leave the land as you found it\n\n" +
              "This protects both of you. It's not adversarial — it's professional.",
          },
          {
            heading: "The digby angle",
            body:
              "Private landowners are also potential digby operators. If you find interesting " +
              "mineralization on their property during a prospecting visit, the conversation " +
              "naturally extends: \"Have you ever thought about allowing rockhounders to visit? " +
              "There's a platform for that.\"\n\n" +
              "That's how digby's operator network grows — one landowner conversation at a " +
              "time, built on genuine relationships and real geological knowledge rather than " +
              "cold outreach.\n\n" +
              "The prospecting and the platform building are the same activity. Every " +
              "landowner conversation is both.",
          },
          {
            heading: "One more thing",
            body:
              "Introduce yourself to hunt camp owners and seasonal residents too. They know " +
              "the land in ways that no map captures. Where the old roads go. Where the rock " +
              "faces are. Where people used to dig. That knowledge is worth more than an " +
              "afternoon on the MLAS map.\n\n" +
              "Buy them a coffee if you can.",
          },
        ],
        tryIt:
          "Find a documented mineral occurrence on the Digby geology map that appears to fall " +
          "on or near private land (cross-reference the MLAS Alienation layer). Think through " +
          "the conversation you'd have with that landowner. What would you say in the first " +
          "30 seconds? What are you offering them? What are you asking for?",
        linkLabel: "Open Digby geology map",
        linkHref: "/map",
        prevSlug: "6",
      },
    ],
  },
];

export function getLesson(trackId: "field" | "gis" | "prospector", slug: string): Lesson | undefined {
  const track = TRACKS.find((t) => t.id === trackId);
  return track?.lessons.find((l) => l.slug === slug);
}
