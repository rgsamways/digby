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
  id: "field" | "gis";
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
];

export function getLesson(trackId: "field" | "gis", slug: string): Lesson | undefined {
  const track = TRACKS.find((t) => t.id === trackId);
  return track?.lessons.find((l) => l.slug === slug);
}
