import { NextRequest, NextResponse } from "next/server";
import responseJson from "../../response.json";

// Dummy analysis response - imported directly from response.json to ensure all fields are included
const dummyResponse = responseJson;
    "status": "success",
    "analysis_id": "analysis_20251127_161539_Cattle",
    "topic": "Cattle",
    "steps_completed": [
        "fetch",
        "triple",
        "semanticdrift",
        "factcheck",
        "sentiment",
        "multimodal",
        "judging"
    ],
    "results": {
        "fetch": {
            "status": "success",
            "grokipedia": {
                "word_count": 9431,
                "char_count": 89928,
                "references_count": 100,
                "sections": 0
            },
            "wikipedia": {
                "word_count": 4472,
                "char_count": 28245,
                "references_count": 100
            },
            "files": {
                "grokipedia": "dual_scraper_output/grokipedia.txt",
                "wikipedia": "dual_scraper_output/wikipedia.txt"
            }
        },
        "triple": {
            "status": "success",
            "basic_stats": {
                "source_a_triples": 4351,
                "source_b_triples": 817,
                "total_triples": 5168
            },
            "triple_overlap": {
                "exact_overlap_count": 1,
                "exact_overlap_score": 0.09,
                "fuzzy_overlap_count": 1,
                "fuzzy_overlap_score": 0.09,
                "unique_to_source_a": 1154,
                "unique_to_source_b": 800
            },
            "semantic_similarity": {
                "average_similarity": 0.1042,
                "max_similarity": 1.0,
                "similar_pairs_count": 1411,
                "similar_pairs_percentage": 0.04,
                "method": "sentence-transformers"
            },
            "graph_embeddings": {
                "TransE": {
                    "average_similarity": 0.0058,
                    "max_similarity": 0.6877,
                    "entity_count": 1874,
                    "relation_count": 1125
                },
                "DistMult": {
                    "average_similarity": 0.0064,
                    "max_similarity": 0.5389,
                    "entity_count": 1874,
                    "relation_count": 1125
                },
                "ComplEx": {
                    "average_similarity": 0.0071,
                    "max_similarity": 0.4876,
                    "entity_count": 1874,
                    "relation_count": 1125
                }
            },
            "graph_density": {
                "source_a_density": 446.9,
                "source_b_density": 173.57,
                "density_delta": 273.33,
                "density_ratio": 2.57
            },
            "entity_coherence": {
                "common_entities": 135,
                "consistent_entities": 0,
                "partially_consistent_entities": 1,
                "coherence_score": 0.0,
                "average_overlap_ratio": 0.15,
                "inconsistent_examples": [
                    {
                        "entity": "73",
                        "overlap_ratio": 0.0,
                        "source_a_relations": [
                            "] https://www.sciencedirect.com/science/article/abs/pii/S0168159117302290 \n   [:74",
                            "] https://www.sciencedirect.com/science/article/abs/pii/S0168159117302290 \n   [ 74 ] https://christiannawroth.wordpress.com/2017/10/31/bovine-psychology-cows-experience-rich-emotional-and-cognitive-lives/ \n   [:75"
                        ],
                        "source_b_relations": [
                            "] http://www.departments.bucknell.edu/biology/resources/msw3/browse.asp?id=14200668 \n   [ 74 ] http://www.petermaas.nl/extinct/speciesinfo/aurochs.htm \n   [:75",
                            "] http://www.departments.bucknell.edu/biology/resources/msw3/browse.asp?id=14200668 \n   [:74"
                        ]
                    },
                    {
                        "entity": "the united states",
                        "overlap_ratio": 0.0,
                        "source_a_relations": [
                            "88.8 million , China:73.6 million",
                            "report:=",
                            "produce:102 million tonnes"
                        ],
                        "source_b_relations": [
                            "104.1 million ton ;:India"
                        ]
                    },
                    {
                        "entity": "72",
                        "overlap_ratio": 0.0,
                        "source_a_relations": [
                            "] https://pubmed.ncbi.nlm.nih.gov/40250611/ \n   [:73",
                            "] https://pubmed.ncbi.nlm.nih.gov/40250611/ \n   [ 73 ] https://www.sciencedirect.com/science/article/abs/pii/S0168159117302290 \n   [:74"
                        ],
                        "source_b_relations": [
                            "] https://web.archive.org/web/20171204171106/https://www.researchgate.net/publication/222110938_on_the_origin_of_cattle_how_aurochs_became_domestic_and_colonized_the_world \n   [:73",
                            "] https://web.archive.org/web/20171204171106/https://www.researchgate.net/publication/222110938_on_the_origin_of_cattle_how_aurochs_became_domestic_and_colonized_the_world \n   [ 73 ] http://www.departments.bucknell.edu/biology/resources/msw3/browse.asp?id=14200668 \n   [:74"
                        ]
                    },
                    {
                        "entity": "17",
                        "overlap_ratio": 0.0,
                        "source_a_relations": [
                            "] https://www.sciencedirect.com/science/article/pii/s1055790304002647 \n   [:18",
                            "] https://www.sciencedirect.com/science/article/pii/s1055790304002647 \n   [ 18 ] https://bmcgenomics.biomedcentral.com/articles/10.1186/1471-2164-10-177 \n   [:19"
                        ],
                        "source_b_relations": [
                            "] http://www.ciwf.org.uk/farm-animals/cows/veal-calves/ \n   [ 18 ] http://www.fao.org/fileadmin/templates/est/comm_markets_monitoring/hides_skins/documents/compendium2013.pdf \n   [:19",
                            "] http://www.ciwf.org.uk/farm-animals/cows/veal-calves/ \n   [:18"
                        ]
                    },
                    {
                        "entity": "indian",
                        "overlap_ratio": 0.0,
                        "source_a_relations": [
                            "aurochs subspecie:Indus Valley"
                        ],
                        "source_b_relations": [
                            "state . small breed miniature:Zebu"
                        ]
                    }
                ]
            },
            "provenance_analysis": {
                "source_a_cited": 3725,
                "source_a_cited_percentage": 85.61,
                "source_b_cited": 54,
                "source_b_cited_percentage": 6.61,
                "citation_gap": 3671,
                "cited_overlap": 0,
                "provenance_quality_score_a": 85.61,
                "provenance_quality_score_b": 6.61,
                "extraction_methods_a": {
                    "dependency_parsing": 3579,
                    "openie_pattern": 21,
                    "entity_relation": 608,
                    "nominal_relation": 143
                },
                "extraction_methods_b": {
                    "dependency_parsing": 171,
                    "openie_pattern": 67,
                    "entity_relation": 429,
                    "nominal_relation": 150
                },
                "unsourced_triples_a": 626,
                "unsourced_triples_b": 763,
                "unsourced_percentage_a": 14.39,
                "unsourced_percentage_b": 93.39
            },
            "contradictions": {
                "contradiction_count": 4,
                "contradictions": [
                    {
                        "subject": "Cattle",
                        "predicate": "be",
                        "source_a_object": "large quadrupedal ungulates",
                        "source_b_object": "large artiodactyls"
                    },
                    {
                        "subject": "Cattle",
                        "predicate": "be",
                        "source_a_object": "large quadrupedal ungulates",
                        "source_b_object": "ruminants"
                    },
                    {
                        "subject": "which",
                        "predicate": "transmit",
                        "source_a_object": "anaplasmosis",
                        "source_b_object": "diseases"
                    },
                    {
                        "subject": "which",
                        "predicate": "reduce",
                        "source_a_object": "agonistic interactions",
                        "source_b_object": "the carrying capacity of the land"
                    }
                ],
                "filtered_noise_triples_a": 44,
                "filtered_noise_triples_b": 58
            }
        },
        "semanticdrift": {
            "status": "success",
            "semantic_drift_score": {
                "overall_drift_score": 1.7802911795953518,
                "drift_percentage": 178.02911795953517,
                "component_scores": {
                    "sentence_embedding_drift": 0.6955040693283081,
                    "cross_encoder_drift": 5.059161186218262,
                    "kg_embedding_drift": 0.9980784102032582,
                    "topic_drift": 0.3684210526315789
                },
                "interpretation": "Very High Drift - Major semantic differences"
            },
            "sentence_embeddings": {
                "average_similarity": 0.3044959306716919,
                "max_similarity": 1.0,
                "min_similarity": -0.06849709153175354
            },
            "cross_encoder": {
                "average_similarity": -4.059161186218262
            },
            "knowledge_graph_embeddings": {
                "TransE": {
                    "grokipedia_entities": 1246,
                    "wikipedia_entities": 799,
                    "common_entities": 171,
                    "average_entity_similarity": -0.014661507681012154
                },
                "DistMult": {
                    "grokipedia_entities": 1246,
                    "wikipedia_entities": 799,
                    "common_entities": 171,
                    "average_entity_similarity": 0.010927773080766201
                },
                "ComplEx": {
                    "grokipedia_entities": 1246,
                    "wikipedia_entities": 799,
                    "common_entities": 171,
                    "average_entity_similarity": 0.009498503990471363
                }
            },
            "topic_modeling": {
                "method": "BERTopic",
                "topics": [
                    0,
                    -1,
                    -1,
                    0,
                    0,
                    0,
                    -1,
                    5,
                    3,
                    -1,
                    2,
                    -1,
                    2,
                    3,
                    5,
                    -1,
                    -1,
                    0,
                    0,
                    0,
                    -1,
                    3,
                    1,
                    4,
                    -1,
                    1,
                    1,
                    1,
                    -1,
                    3,
                    3,
                    5,
                    -1,
                    -1,
                    -1,
                    0,
                    0,
                    0,
                    0,
                    1,
                    -1,
                    -1,
                    -1,
                    4,
                    2,
                    2,
                    -1,
                    2,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    0,
                    0,
                    -1,
                    4,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    -1,
                    4,
                    -1,
                    -1,
                    -1,
                    3,
                    4,
                    -1,
                    -1,
                    -1,
                    -1,
                    0,
                    0
                ],
                "probabilities": [
                    [
                        0.5274853793075188,
                        0.12903441654437842,
                        0.07560120819714314,
                        0.07618913187444347,
                        0.0913034214648876,
                        0.10038644261162856
                    ],
                    [
                        0.11205006620581173,
                        0.14372050307736534,
                        0.08002881179571435,
                        0.10912606337832799,
                        0.11470130241502742,
                        0.08934950330134074
                    ],
                    [
                        0.193185359137758,
                        0.24310710411621073,
                        0.07199171380718211,
                        0.08962600885224488,
                        0.10612693532669717,
                        0.08591576787392392
                    ],
                    [
                        0.574313407341812,
                        0.08279774857001375,
                        0.07877781535536338,
                        0.06475148267004334,
                        0.07596178559483946,
                        0.12339776046792793
                    ],
                    [
                        1.0,
                        1.578043578793688e-308,
                        1.4908253721519134e-308,
                        1.265461699883876e-308,
                        1.438307838053811e-308,
                        2.2839143192438193e-308
                    ],
                    [
                        2.5101189807473837e-308,
                        1.354255046846549e-308,
                        5.600452635066055e-308,
                        1.9226059230486273e-308,
                        1.814803585629474e-308,
                        1.0
                    ],
                    [
                        1.2940154125033555e-308,
                        2.439397038788834e-308,
                        1.725401995545887e-308,
                        1.0,
                        2.371077022032206e-308,
                        1.5805075088979907e-308
                    ],
                    [
                        0.11759999903887293,
                        0.10004540795721298,
                        0.1369089835590169,
                        0.10521310838293106,
                        0.17822665830140164,
                        0.15497394870198308
                    ],
                    [
                        0.07268841547137438,
                        0.051910549706700906,
                        0.45230455172758394,
                        0.08513723092782573,
                        0.0819301946013552,
                        0.20766797378006027
                    ],
                    [
                        1.5582641276928226e-308,
                        1.1218722384328916e-308,
                        1.0,
                        1.9891428043282137e-308,
                        1.8206022063579347e-308,
                        4.927854167292723e-308
                    ],
                    [
                        0.07044562198498437,
                        0.08023651969716926,
                        0.172483312776394,
                        0.2658878638195969,
                        0.12767494777063124,
                        0.1217489881449921
                    ],
                    [
                        2.2719358325181365e-308,
                        1.1910398093434875e-308,
                        4.8165401911293e-308,
                        1.6557450108243967e-308,
                        1.5905648858543256e-308,
                        1.0
                    ],
                    [
                        0.08493922502310625,
                        0.07832923967784393,
                        0.30048597160278256,
                        0.14711405766032593,
                        0.133926622325603,
                        0.18223723403152106
                    ],
                    [
                        0.5063459823295906,
                        0.07849771271170249,
                        0.09654520696335032,
                        0.0715334938312225,
                        0.07939862299708268,
                        0.16767898116705118
                    ],
                    [
                        0.46840194062443835,
                        0.10060807098717732,
                        0.09559794460272518,
                        0.08091912063706266,
                        0.09762441471401556,
                        0.137801053662982
                    ],
                    [
                        0.2896111334598278,
                        0.09434655453703111,
                        0.10664198699038262,
                        0.08398740646834053,
                        0.10414184662625954,
                        0.15180722225046803
                    ],
                    [
                        0.08452229272096641,
                        0.13439590980560254,
                        0.11251579166553448,
                        0.3836992740390382,
                        0.17638793155312527,
                        0.10326694783437897
                    ],
                    [
                        1.3006910624286753e-308,
                        1.0,
                        1.0443399214312607e-308,
                        2.0481284378989185e-308,
                        2.2101580655079307e-308,
                        1.058262751082421e-308
                    ],
                    [
                        1.4865343737169507e-308,
                        2.169602277105545e-308,
                        1.8022971088979087e-308,
                        2.1376473924460305e-308,
                        1.0,
                        1.6683344419251154e-308
                    ],
                    [
                        0.07234156242255169,
                        0.3546073866805044,
                        0.06666988368256,
                        0.1668203685288458,
                        0.13725179599000212,
                        0.06609815441490384
                    ],
                    [
                        0.06522917446563342,
                        0.2506858874445303,
                        0.06746850965051295,
                        0.1530904527398912,
                        0.17958260931799017,
                        0.06587507869629859
                    ],
                    [
                        1.8095015837517374e-308,
                        1.0,
                        1.132257432506547e-308,
                        1.828300628866146e-308,
                        2.2022368308069255e-308,
                        1.210507793233074e-308
                    ],
                    [
                        1.3800872967691e-308,
                        1.9558387752744777e-308,
                        2.209440932432222e-308,
                        1.0,
                        2.416513031055316e-308,
                        1.887227349268808e-308
                    ],
                    [
                        0.06900671657676409,
                        0.122310245412839,
                        0.0834525132305054,
                        0.4668222607665603,
                        0.11151907586086726,
                        0.07845198999952453
                    ],
                    [
                        3.090798168797548e-308,
                        1.3505702383940643e-308,
                        3.9173519475048726e-308,
                        1.7298100989885695e-308,
                        1.6823223079934125e-308,
                        1.0
                    ],
                    [
                        0.0569809529139194,
                        0.1939166374844297,
                        0.05727128414894159,
                        0.16702059590064638,
                        0.11590353719972453,
                        0.05610143405387792
                    ],
                    [
                        0.08490876636379396,
                        0.07664105129469587,
                        0.25572729683112044,
                        0.13850467826111776,
                        0.18224415289813053,
                        0.160475101536266
                    ],
                    [
                        0.3030342755016838,
                        0.12629793531929126,
                        0.08086364582562386,
                        0.07746218628956762,
                        0.10029814805431282,
                        0.10906777501172794
                    ],
                    [
                        0.5638600678497366,
                        0.12857998847996283,
                        0.06688520503188135,
                        0.07381492680939285,
                        0.08131911623390338,
                        0.08554069559512288
                    ],
                    [
                        1.0,
                        1.792050213188122e-308,
                        1.1163762913384547e-308,
                        1.1213625266047903e-308,
                        1.30739786306633e-308,
                        1.4654634910762303e-308
                    ],
                    [
                        0.46268388719975234,
                        0.12669590237044176,
                        0.09213144146047107,
                        0.08368527786160437,
                        0.10322315986447256,
                        0.13158033124325805
                    ],
                    [
                        0.14316674295496354,
                        0.30478506094167235,
                        0.06497428852182704,
                        0.08384709454674179,
                        0.10946992224570948,
                        0.07546434319074592
                    ],
                    [
                        0.10655297880016747,
                        0.10209955368249064,
                        0.09852588182346084,
                        0.0971533297458775,
                        0.12365323773772445,
                        0.12099126838386683
                    ],
                    [
                        0.04802642147127629,
                        0.08592479170523352,
                        0.061522087439080435,
                        0.4390241442817676,
                        0.08044394671217404,
                        0.05716115098457782
                    ],
                    [
                        0.09712211380042124,
                        0.10849245894564928,
                        0.13371960840013777,
                        0.12400268213770338,
                        0.23158510266519663,
                        0.1351637876363858
                    ],
                    [
                        0.04944926483610574,
                        0.0337226456794806,
                        0.6152055837921943,
                        0.05308627239670387,
                        0.05401628952723891,
                        0.14615885998317696
                    ],
                    [
                        1.3365262104520773e-308,
                        9.775386402220933e-309,
                        1.0,
                        1.550983589754662e-308,
                        1.595363681235641e-308,
                        3.4423559890437116e-308
                    ],
                    [
                        0.06094248748297076,
                        0.044326198441808844,
                        0.37000334539559715,
                        0.0812637119467388,
                        0.06620775477854385,
                        0.17305775222249006
                    ],
                    [
                        0.06156100313084969,
                        0.06895418530613112,
                        0.14541870734148282,
                        0.24228892285628012,
                        0.1028909864852297,
                        0.1035261241025215
                    ],
                    [
                        1.464161705468153e-308,
                        1.0448552569064347e-308,
                        1.0,
                        1.7085692568565866e-308,
                        1.7290532525933813e-308,
                        3.9433712359406935e-308
                    ],
                    [
                        0.0890164369157061,
                        0.09094391869520643,
                        0.16970536528131944,
                        0.13449056671704623,
                        0.15712877262783317,
                        0.15168304570430724
                    ],
                    [
                        0.14030579034472354,
                        0.06654914682161076,
                        0.21522515508096993,
                        0.08573959435043042,
                        0.08824893886580897,
                        0.39858212205941007
                    ],
                    [
                        1.0,
                        1.4031170676621007e-308,
                        1.3487463765443817e-308,
                        1.1167640196457747e-308,
                        1.2727938450372943e-308,
                        2.081514948554279e-308
                    ],
                    [
                        1.0,
                        1.4236658517084425e-308,
                        1.5846300856423607e-308,
                        1.2171244955694634e-308,
                        1.3935216072331616e-308,
                        2.782273729062365e-308
                    ],
                    [
                        1.5005541631637177e-308,
                        2.601353796057939e-308,
                        1.757574926338416e-308,
                        2.309604616780238e-308,
                        1.0,
                        1.6721531562210243e-308
                    ],
                    [
                        0.04884641139062416,
                        0.5999292991318284,
                        0.03715843583619671,
                        0.07185773681490185,
                        0.07267804003119249,
                        0.03799620985107036
                    ],
                    [
                        0.08650558490207241,
                        0.3024768606881313,
                        0.06304533791608045,
                        0.09850363427086568,
                        0.15340602194331543,
                        0.06697991016093481
                    ],
                    [
                        1.532199107494305e-308,
                        1.0,
                        1.1328388738118804e-308,
                        2.2210731273340957e-308,
                        2.342068102578181e-308,
                        1.1690502846278976e-308
                    ],
                    [
                        0.05617934525748488,
                        0.13743318490353945,
                        0.05889233792154527,
                        0.09191951194266598,
                        0.2728719027105959,
                        0.058637085027961076
                    ],
                    [
                        0.07212046072823829,
                        0.4471229467284716,
                        0.042029952845568916,
                        0.0650920201003958,
                        0.07716494795221124,
                        0.04514831720670211
                    ],
                    [
                        1.5706230904048926e-308,
                        1.0,
                        1.112120764212208e-308,
                        1.8891265232186134e-308,
                        2.4730521056942515e-308,
                        1.160202266059024e-308
                    ],
                    [
                        1.4502106016055576e-308,
                        1.8429775878184e-308,
                        1.9297806141259906e-308,
                        2.1884722055244585e-308,
                        1.0,
                        1.7028048870762263e-308
                    ],
                    [
                        0.06972266535505507,
                        0.08049079090779805,
                        0.12212808844078127,
                        0.13832392384455677,
                        0.30168342236802026,
                        0.0966687093188014
                    ],
                    [
                        0.0603470809490002,
                        0.08662922299668754,
                        0.07105171563043587,
                        0.08885317851188768,
                        0.39316989286977205,
                        0.06534143260884111
                    ],
                    [
                        1.287880740430236e-308,
                        2.14146421014243e-308,
                        1.759612264881555e-308,
                        1.0,
                        2.1876471529130513e-308,
                        1.5828898453396195e-308
                    ],
                    [
                        0.08129765837912618,
                        0.09737779721175001,
                        0.11627682656619137,
                        0.12779559197810814,
                        0.301418389890691,
                        0.10591948955962734
                    ],
                    [
                        0.20145726561868899,
                        0.20448141977837345,
                        0.07089723947628532,
                        0.08265900077857427,
                        0.10511324269614619,
                        0.08527354074471989
                    ],
                    [
                        1.0,
                        1.599155167477542e-308,
                        1.120361254717745e-308,
                        1.0654828118056626e-308,
                        1.2189525627014667e-308,
                        1.5369787026654616e-308
                    ],
                    [
                        1.0,
                        1.763567683064695e-308,
                        1.094775633623682e-308,
                        1.150968626147558e-308,
                        1.234019740013198e-308,
                        1.42198682610987e-308
                    ]
                ],
                "topic_info": {
                    "Topic": {
                        "0": -1,
                        "1": 0,
                        "2": 1,
                        "3": 2,
                        "4": 3,
                        "5": 4,
                        "6": 5
                    },
                    "Count": {
                        "0": 13,
                        "1": 15,
                        "2": 11,
                        "3": 6,
                        "4": 6,
                        "5": 5,
                        "6": 3
                    },
                    "Name": {
                        "0": "-1_the_and_in_of",
                        "1": "0_https_www_com_org",
                        "2": "1_million_the_of_and",
                        "3": "2_and_to_in_of",
                        "4": "3_and_to_in_grazing",
                        "5": "4_and_to_the_of",
                        "6": "5_and_bos_breeds_in"
                    },
                    "Representation": {
                        "0": [
                            "the",
                            "and",
                            "in",
                            "of",
                            "to",
                            "with",
                            "cattle",
                            "is",
                            "for",
                            "by"
                        ],
                        "1": [
                            "https",
                            "www",
                            "com",
                            "org",
                            "cattle",
                            "the",
                            "articles",
                            "and",
                            "gov",
                            "of"
                        ],
                        "2": [
                            "million",
                            "the",
                            "of",
                            "and",
                            "in",
                            "milk",
                            "for",
                            "to",
                            "production",
                            "as"
                        ],
                        "3": [
                            "and",
                            "to",
                            "in",
                            "of",
                            "with",
                            "cattle",
                            "their",
                            "dominance",
                            "social",
                            "calves"
                        ],
                        "4": [
                            "and",
                            "to",
                            "in",
                            "grazing",
                            "of",
                            "with",
                            "the",
                            "cattle",
                            "systems",
                            "emissions"
                        ],
                        "5": [
                            "and",
                            "to",
                            "the",
                            "of",
                            "or",
                            "is",
                            "in",
                            "by",
                            "are",
                            "disease"
                        ],
                        "6": [
                            "and",
                            "bos",
                            "breeds",
                            "in",
                            "to",
                            "heat",
                            "indicus",
                            "taurus",
                            "for",
                            "with"
                        ]
                    },
                    "Representative_Docs": {
                        "0": [
                            "Cattle are ruminants, meaning their digestive system is highly specialized for processing plant material such as grass rich in cellulose, a tough carbohydrate polymer which many animals cannot digest. They do this in symbiosis with micro-organisms – bacteria, fungi, and protozoa – that possess cellulases, enzymes that split cellulose into its constituent sugars. Among the many bacteria that contribute are Fibrobacter succinogenes, Ruminococcus flavefaciens, and Ruminococcus albus. Cellulolytic fungi include several species of Neocallimastix, while the protozoa include the ciliates Eudiplodinium maggie and Ostracodinium album. If the animal's feed changes over time, the composition of this microbiome changes in response.\nCattle have one large stomach with four compartments; the rumen, reticulum, omasum, and abomasum. The rumen is the largest compartment and it harbours the most important parts of the microbiome. The reticulum, the smallest compartment, is known as the \"honeycomb\". The omasum's main function is to absorb water and nutrients from the digestible feed. The abomasum has a similar function to the human stomach.\nCattle regurgitate and re-chew their food in the process of chewing the cud, like most ruminants. While feeding, cows swallow their food without chewing; it goes into the rumen for storage. Later, the food is regurgitated to the mouth, a mouthful at a time, where the cud is chewed by the molars, grinding down the coarse vegetation to small particles. The cud is then swallowed again and further digested by the micro-organisms in the cow's stomach.",
                            "Cattle welfare in intensive production systems, such as feedlots, involves trade-offs between efficiency and indicators of stress, including reduced space allowances that degrade environmental quality and increase aggression or injury risks, as evidenced by behavioral and physiological measures like elevated cortisol levels during heat stress episodes.[277] [278] Pasture-based systems generally yield superior outcomes in reducing lameness, hock lesions, and mastitis incidence compared to continuous confinement, though both can expose animals to weather-related stressors like prolonged hunger or cold.[279] [280]\nRoutine management procedures like dehorning and castration elicit measurable pain responses in calves, including vocalizations, elevated heart rates, and cortisol spikes, with additive effects when combined; while local anesthetics and NSAIDs like meloxicam mitigate these, adoption remains inconsistent, with only about 20% of U.S. producers using relief for castration in some surveys.[281] [282] [283] Empirical assessments confirm these interventions reduce behavioral indicators of distress, underscoring the causal link between unmitigated nociception and welfare compromise, though full elimination of such practices would alter production economics without proven net benefits to overall health.[284]\nIn dairy operations, early cow-calf separation, typically within 24 hours of birth, disrupts natural bonding and can induce vocal distress and altered feeding in both, but systematic reviews find no clear detriment to long-term health metrics like growth or disease resistance, with some evidence suggesting reduced calf mortality from targeted colostrum management.[285] [286] Gradual weaning strategies may lessen acute stress compared to abrupt methods, yet industry practices prioritize milk yield efficiency, which correlates with lower separation-related pathologies in controlled studies.[287] [288]\nTransport mortality for cattle averages 0.027% in road shipments, lower than for pigs, with injuries linked primarily to density and duration exceeding 12 hours, prompting regulations like EU limits on journey times without rest.[289] [290] U.S. oversight under the Humane Methods of Slaughter Act mandates pre-slaughter stunning, achieving high compliance in inspected facilities per FSIS audits, though non-compliance incidents, such as ineffective captive bolt use, occur at rates below 5% in recent evaluations.[291] [292]\nRegulatory frameworks differ markedly: EU directives enforce stricter housing densities, disbudding timelines, and transport welfare (e.g., maximum 8-hour journeys without feed), fostering outcomes like reduced lameness prevalence, whereas U.S. standards emphasize outcome-based inspections with voluntary industry codes, reflecting a philosophy prioritizing producer flexibility over prescriptive norms.[293] [294] These variances yield empirical divergences, with European systems showing lower chronic disease burdens but higher operational costs, highlighting causal tensions between welfare metrics and scalable production.[295]",
                            "Cattle products, particularly beef and dairy, provide dense sources of bioavailable nutrients essential for human health. A 100-gram serving of cooked beef delivers approximately 250 calories, 35 grams of high-quality protein containing all essential amino acids, 10 grams of fat (including monounsaturated varieties), and significant amounts of heme iron, zinc, and vitamin B12.[260] Whole cow milk, per 100 grams, supplies about 60 calories, 3.2 grams of protein, 3.25 grams of fat, 4.5 grams of carbohydrates primarily as lactose, and key minerals like calcium and phosphorus, alongside vitamin B12 and riboflavin.[261] [262] These compositions position beef as a complete protein source supporting muscle maintenance and repair, while dairy contributes to bone health through its calcium content, which is more readily absorbed when paired with milk's lactose and vitamin D.[263]\nBeef and dairy excel in delivering nutrients with superior bioavailability compared to plant-based alternatives. Heme iron in beef, which constitutes 40-55% of its total iron content, exhibits absorption rates of 15-35%, far exceeding the 2-20% for non-heme iron from plants, enhanced further by meat's intrinsic factors that promote uptake.[264] [265] Vitamin B12, absent in plant foods and critical for neurological function and red blood cell formation, is predominantly sourced from animal products; deficiency affects roughly 3.6% of U.S. adults aged 19 and older, rising to 6% or more in those over 60, with vegans at highest risk without supplementation.[266] Dairy reinforces this by providing B12 alongside iodine and other micronutrients often deficient in restricted diets.[267]\nIn global public health, cattle products play a pivotal role in addressing malnutrition, supplying 34% of worldwide protein intake and essential micronutrients like B12, iron, and zinc that combat stunting and anemia, particularly in the first 1,000 days of life for children in low-income regions.[268] [269] In the U.S., beef alone meets protein needs for over 43 million people and B12 requirements for 137 million, underscoring its efficiency in nutrient delivery per calorie.[270] These foods support cognitive development, immune function, and growth, with livestock-derived items proven effective in reducing micronutrient gaps where plant sources fall short due to lower absorption.[271]\nAssociations between unprocessed red meat consumption and adverse outcomes like colorectal cancer, type 2 diabetes, or cardiovascular disease stem largely from observational studies showing weak or inconsistent evidence, often confounded by factors such as overall diet quality, smoking, and physical inactivity rather than causation from meat itself.[272] [273] Processed meats exhibit stronger links to health risks, but unprocessed beef's nutrient profile generally outweighs purported harms in balanced diets, as systematic reviews indicate no robust causal ties when isolating variables.[274] [275] Dairy consumption similarly shows neutral or protective effects against certain conditions like osteoporosis, despite saturated fat concerns, with benefits amplified in grass-fed variants offering higher omega-3 levels.[276] Public health strategies emphasizing cattle products thus prioritize empirical nutrient contributions over alarmist interpretations of correlative data."
                        ],
                        "1": [
                            "[1] http://www.defra.gov.uk/animalh/tb/publications/hpanel.pdf\n  [2] http://www.breedsofcattle.net/\n  [3] http://www.ansi.okstate.edu/breeds/cattle\n  [4] http://www.cattle-today.com/\n  [5] http://www.ucsusa.org/assets/documents/food_and_agriculture/cafos-uncovered.pdf\n  [6] http://web.missouri.edu/~ikerdj/papers/Fairfield%20IA%20-%20Economics%20of%20CAFOs.htm\n  [7] http://www.cals.ncsu.edu/waste_mgt/natlcenter/sanantonio/balvanz.pdf\n  [8] http://www.google.com/books?id=JgAMbNSt8ikC&pg=PA637\n  [9] http://www.thecattlesite.com/diseaseinfo/\n  [10] https://web.archive.org/web/20040722232232/http://www.defra.gov.uk/animalh/tb/publications/hpanel.pdf\n  [11] http://www.merriam-webster.com/dictionary/feral\n  [12] http://beefmagazine.com/genetics/0201-increased-beef-cows\n  [13] http://www.cattlenetwork.net/breeds/hereford.htm\n  [14] http://www.journalofdairyscience.org/article/S0022-0302(79)83526-2/abstract\n  [15] http://www.ciwf.org.uk/farm-animals/cows/dairy-cows/\n  [16] http://ukcows.com/holsteinUK/publicweb/Education/HUK_Edu_DairyCows.aspx?cmh=66\n  [17] http://www.ciwf.org.uk/farm-animals/cows/veal-calves/\n  [18] http://www.fao.org/fileadmin/templates/est/COMM_MARKETS_MONITORING/Hides_Skins/Documents/COMPENDIUM2013.pdf\n  [19] http://www.appliedanimalbehaviour.com/article/S0168-1591(03)00294-6/abstract\n  [20] http://www.tech.nagoya-u.ac.jp/event/h26/Vol10/hon_secur/O9-SEI-1-s.pdf\n  [21] http://www.nodai-genome.org/bos_taurus.html?lang=en\n  [22] http://chillinghamwildcattle.com/science/\n  [23] http://www.highbeam.com/doc/1P2-80866.html\n  [24] https://books.google.com/books?id=74Hd_YLuHsUC&pg=PT109\n  [25] http://www.appliedanimalbehaviour.com/article/S0168-1591(14)00249-4/abstract\n  [26] http://extension.psu.edu/animals/dairy/health/reproduction/insemination/ec402/signs-of-heat\n  [27] http://articles.extension.org/pages/11129/taking-advantage-of-natural-behavior-improves-dairy-cow-performance\n  [28] https://www.theguardian.com/environment/2011/may/17/farming-regulation-tb-cattle-milk\n  [29] http://www.departments.bucknell.edu/biology/resources/msw3/browse.asp?id=14200687\n  [30] http://www.mvma.ca/resources/animal-owners/animal-mythbusters#cow+tipping\n  [31] https://web.archive.org/web/20150124050154/http://www.cattlenetwork.net/breeds/hereford.htm\n  [32] https://web.archive.org/web/20150503101557/http://beefmagazine.com/genetics/0201-increased-beef-cows\n  [33] https://web.archive.org/web/20170707160417/https://www.researchgate.net/profile/Julie_Johnsen/publication/274013035_The_effect_of_physical_contact_between_dairy_cows_and_calves_during_separation_on_their_post-separation_behavioural_response/links/551541630cf2d70ee26fee97.pdf\n  [34] https://web.archive.org/web/20161105161839/http://extension.psu.edu/animals/dairy/health/reproduction/insemination/ec402/signs-of-heat\n  [35] https://web.archive.org/web/20131017195942/http://news.bbc.co.uk/2/hi/science/nature/8014598.stm\n  [36] https://web.archive.org/web/20150924121237/http://www.researchgate.net/profile/Bodo_Brand/publication/275837207_Genetics_of_cattle_temperament_and_its_impact_on_livestock_production_and_breeding__a_review/links/55485d420cf2e2031b386dd8.pdf\n  [37] https://web.archive.org/web/20160415135131/http://www.mvma.ca/resources/animal-owners/animal-mythbusters#cow+tipping\n  [38] https://web.archive.org/web/20160426021919/http://www.telegraph.co.uk/news/science/science-news/10289862/Cow-tipping-myth-dispelled.html\n  [39] https://web.archive.org/web/20150518064015/http://ukcows.com/holsteinUK/publicweb/Education/HUK_Edu_DairyCows.aspx?cmh=66\n  [40] https://web.archive.org/web/20150518074913/http://www.ciwf.org.uk/farm-animals/cows/dairy-cows/\n  [41] https://web.archive.org/web/20150518074915/http://www.ciwf.org.uk/farm-animals/cows/veal-calves/\n  [42] https://web.archive.org/web/20150128005513/http://www.fao.org/fileadmin/templates/est/COMM_MARKETS_MONITORING/Hides_Skins/Documents/COMPENDIUM2013.pdf\n  [43] https://web.archive.org/web/20150921162050/http://www.merriam-webster.com/dictionary/feral\n  [44] https://web.archive.org/web/20160223064915/http://www.nodai-genome.org/bos_taurus.html?lang=en\n  [45] https://web.archive.org/web/20160425012219/http://www.tech.nagoya-u.ac.jp/event/h26/Vol10/hon_secur/O9-SEI-1-s.pdf\n  [46] https://web.archive.org/web/20160509052751/http://chillinghamwildcattle.com/science/\n  [47] https://web.archive.org/web/20130126213408/http://www.ucsusa.org/assets/documents/food_and_agriculture/cafos-uncovered.pdf\n  [48] https://web.archive.org/web/20131017230339/http://www.cals.ncsu.edu/waste_mgt/natlcenter/sanantonio/balvanz.pdf\n  [49] https://web.archive.org/web/20140810081852/http://web.missouri.edu/~ikerdj/papers/Fairfield%20IA%20-%20Economics%20of%20CAFOs.htm\n  [50] https://web.archive.org/web/20140201102312/http://www.theguardian.com/environment/2011/may/17/farming-regulation-tb-cattle-milk\n  [51] https://web.archive.org/web/20161202101756/http://articles.extension.org/pages/11129/taking-advantage-of-natural-behavior-improves-dairy-cow-performance\n  [52] https://books.google.com/books?id=Yx68AAAAIAAJ\n  [53] https://www.telegraph.co.uk/news/science/science-news/10289862/Cow-tipping-myth-dispelled.html\n  [54] https://www.repository.cam.ac.uk/handle/1810/247470\n  [55] https://www.researchgate.net/publication/274013035\n  [56] https://www.researchgate.net/publication/275837207\n  [57] https://www.latimes.com/local/california/la-me-feral-bulls-20180302-story.html\n  [58] http://www.tierstimmen.org/en/database?field_spec_species_target_id_selective=2759\n  [59] https://web.archive.org/web/20121020122750/http://www.highbeam.com/doc/1P2-80866.html\n  [60] https://awionline.org/content/cattle\n  [61] https://www.avma.org/KB/Resources/LiteratureReviews/Pages/Welfare-Implications-of-Dehorning-and-Disbudding-Cattle.aspx\n  [62] https://www.nytimes.com/2012/01/26/us/ear-tagging-proposal-may-mean-fewer-branded-cattle.html\n  [63] https://web.archive.org/web/20170406111331/http://www.nytimes.com/2012/01/26/us/ear-tagging-proposal-may-mean-fewer-branded-cattle.html\n  [64] http://www.grandin.com/references/abdlps.html\n  [65] https://web.archive.org/web/20171213024104/http://www.grandin.com/references/abdlps.html\n  [66] https://www.ciwf.org.uk/media/3818635/case-against-the-veal-crate.pdf\n  [67] http://grandin.com/behaviour/principles/prods.html\n  [68] https://d-nb.info/gnd/4050061-5\n  [69] https://www.vegsoc.org/info-hub/why-go-veggie/animals/cattle/\n  [70] https://zenodo.org/record/1258397\n  [71] https://www.researchgate.net/publication/222110938\n  [72] https://web.archive.org/web/20171204171106/https://www.researchgate.net/publication/222110938_On_the_origin_of_cattle_how_aurochs_became_domestic_and_colonized_the_world\n  [73] http://www.departments.bucknell.edu/biology/resources/msw3/browse.asp?id=14200668\n  [74] http://www.petermaas.nl/extinct/speciesinfo/aurochs.htm\n  [75] https://web.archive.org/web/20090420140454/http://www.petermaas.nl/extinct/speciesinfo/aurochs.htm\n  [76] https://ui.adsabs.harvard.edu/abs/2014PLoSO...998429D\n  [77] https://ui.adsabs.harvard.edu/abs/2013PLoSO...880556N\n  [78] https://ui.adsabs.harvard.edu/abs/2013PNAS..110E1398M\n  [79] https://biodiversitylibrary.org/page/34357823\n  [80] http://www.fao.org/faostat/en/#data/QL\n  [81] https://hls-dhs-dss.ch/fr/articles/013944\n  [82] https://archive.org/details/bub_gb_AJLGKdOZneMC\n  [83] https://archive.org/details/bub_gb_AJLGKdOZneMC/page/n105\n  [84] https://www.oed.com/public/login/loggingin#withyourlibrary\n  [85] https://www.wikidata.org/wiki/Q830#identifiers\n  [86] https://books.google.com/books?id=gxZTBAAAQBAJ\n  [87] https://api.semanticscholar.org/CorpusID:39755371\n  [88] https://api.semanticscholar.org/CorpusID:13283847\n  [89] https://api.semanticscholar.org/CorpusID:8507049\n  [90] https://api.semanticscholar.org/CorpusID:34619742\n  [91] https://api.semanticscholar.org/CorpusID:53145854\n  [92] https://hal.archives-ouvertes.fr/hal-01019444/file/2013_Canario_Animal_1.pdf\n  [93] https://ui.adsabs.harvard.edu/abs/2015PLoSO..1025044B\n  [94] https://api.semanticscholar.org/CorpusID:44753594\n  [95] https://api.semanticscholar.org/CorpusID:86035650\n  [96] https://books.google.com/books?id=LpIbwuYIyEcC&q=cattle+castration+painful&pg=PT70\n  [97] https://books.google.com/books?id=fzc7CgAAQBAJ&q=cattle+nose+ring+pain&pg=PA111\n  [98] https://books.google.com/books?id=xPt1BgAAQBAJ&q=cattle+tail+docking+pain&pg=PA21\n  [99] http://www.lamalla.net/actualitat_cultural/festes_populars/article?id=71973\n  [100] https://archive.today/20120911032132/http://www.lamalla.net/actualitat_cultural/festes_populars/article?id=71973",
                            "[1] https://pmc.ncbi.nlm.nih.gov/articles/PMC6304694/\n  [2] https://www.ucl.ac.uk/news/2012/mar/dna-traces-cattle-back-small-herd-domesticated-around-10500-years-ago\n  [3] https://thoughtco.com/history-of-the-domestication-of-cows-170652\n  [4] https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/bos\n  [5] https://www.fao.org/livestock-systems/global-distributions/cattle/en/\n  [6] https://www.animalbehaviorandcognition.org/uploads/journals/17/AB&C_2017_Vol4%284%29_Marino_Allen.pdf\n  [7] https://www.ers.usda.gov/topics/animal-products/cattle-beef/sector-at-a-glance\n  [8] https://ourworldindata.org/grapher/cattle-livestock-count-heads\n  [9] https://www.worldbank.org/en/topic/agriculture/brief/moving-towards-sustainability-the-livestock-sector-and-the-world-bank\n  [10] https://www.etymonline.com/word/cattle\n  [11] https://www.merriam-webster.com/dictionary/cattle\n  [12] https://livestockconservancy.org/resources/animal-terms/\n  [13] https://cals.cornell.edu/nys-4-h-animal-science-programs/livestock/beef/beef-cattle-terms\n  [14] https://elmwoodstockfarm.com/cattle-vocabulary-101/\n  [15] https://www.gbif.org/species/2441022\n  [16] https://pubchem.ncbi.nlm.nih.gov/taxonomy/9913\n  [17] https://www.sciencedirect.com/science/article/pii/S1055790304002647\n  [18] https://bmcgenomics.biomedcentral.com/articles/10.1186/1471-2164-10-177\n  [19] https://sc.journals.umz.ac.ir/article_2990.html\n  [20] https://www.nature.com/articles/hdy201679\n  [21] https://evolution.berkeley.edu/evo-news/no-more-mystery-meat/\n  [22] https://pmc.ncbi.nlm.nih.gov/articles/PMC3290115/\n  [23] https://www.nature.com/articles/s41598-023-39518-3\n  [24] https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0209645\n  [25] https://pmc.ncbi.nlm.nih.gov/articles/PMC11922504/\n  [26] https://www.thoughtco.com/history-of-the-domestication-of-cows-170652\n  [27] https://academic.oup.com/mbe/article/27/1/1/1127118\n  [28] https://pmc.ncbi.nlm.nih.gov/articles/PMC4445560/\n  [29] https://archaeology.org/issues/july-august-2012/digs-discoveries/the-origins-of-domestic-cattle/\n  [30] https://www.nature.com/articles/s41467-018-04737-0\n  [31] https://www.pnas.org/doi/10.1073/pnas.0509210103\n  [32] https://www.inaturalist.org/guide_taxa/840616\n  [33] https://animaldiversity.org/accounts/Bos_taurus/\n  [34] https://a-z-animals.com/animals/cow/\n  [35] https://www.fao.org/4/t0095e/t0095e04.htm\n  [36] https://dpbck.ac.in/wp-content/uploads/2022/05/Livestock-farming-.pdf\n  [37] https://josera-agriculture.com/tips-tricks/barn-management/cattle-breeds/\n  [38] https://tejasranchfence.com/5-most-common-cattle-breeds-texas/\n  [39] https://www.vetvoice.com.au/articles/difference-between-beef-and-dairy-cattle/\n  [40] https://uwmril.wisc.edu/wp-content/uploads/sites/306/2021/08/1_TECH_1_CowIntroUdderAnatomy.pdf\n  [41] https://extension.umn.edu/dairy-nutrition/ruminant-digestive-system\n  [42] https://swandairy.com/one-stomach-four-chambers/\n  [43] https://vtechworks.lib.vt.edu/items/da383a13-d5fc-470f-a43b-77360cf99ea8\n  [44] https://extension.msstate.edu/publications/understanding-the-ruminant-animal-digestive-system\n  [45] https://www.sciencelearn.org.nz/image_maps/104-ruminant-digestion\n  [46] https://ansci.wsu.edu/2022/08/02/myth-cattle-have-four-stomachs/\n  [47] https://pubmed.ncbi.nlm.nih.gov/14450002/\n  [48] https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2024.1271599/full\n  [49] https://www.sciencedirect.com/science/article/pii/S0022030281826926\n  [50] https://epakag.ucdavis.edu/livestock/factsheets/fs-live-AIP03-HeiferManagement.pdf\n  [51] https://beef-cattle.extension.org/how-long-can-i-keep-a-bull-and-at-what-age-can-a-young-bull-start-mating-cows/\n  [52] https://beef.unl.edu/faq/pregnant-cows/\n  [53] https://www.cattlemax.com/articles/understanding-cattle-gestation\n  [54] https://livestock.extension.wisc.edu/articles/three-stages-of-bovine-parturition/\n  [55] https://www.iowabeefcenter.org/calving/processdelivery.html\n  [56] https://www.merckvetmanual.com/management-and-nutrition/management-of-reproduction-cattle/management-of-calving-in-cattle\n  [57] https://extension.sdstate.edu/calving-dairy-cows-step-step\n  [58] https://agresearch.okstate.edu/facilities/ferguson-family-dairy-center/kindergarten-second-grade-lesson-plans/life-cycle-of-dairy-cattle.html\n  [59] https://education.rspca.org.uk/documents/1494931/0/FS%2BCattle%2BFactsheet.pdf\n  [60] https://sentientmedia.org/how-long-do-cows-live/\n  [61] https://pubmed.ncbi.nlm.nih.gov/18638138/\n  [62] https://boumatic.com/eu_en/expert-blog/look-through-the-eyes-of-a-cow/\n  [63] https://www.farmprogress.com/cattle-news/understanding-cattle-vision-and-hearing-can-improve-handling-efficiency\n  [64] https://www.srpublication.com/experience-cow-vision/\n  [65] https://www.journalofdairyscience.org/article/S0022-0302%2801%2974537-7/pdf\n  [66] https://pmc.ncbi.nlm.nih.gov/articles/PMC11538434/\n  [67] https://psycnet.apa.org/record/1983-29540-001\n  [68] https://www.dexterstoday.com/post/understanding-cattle-behavior-hearing-smell-taste-and-touch\n  [69] https://www.sciencedirect.com/science/article/abs/pii/S1558787822001216\n  [70] https://www.facebook.com/groups/DairyFarmingKenya/posts/7757301847666029/\n  [71] https://www.organicvalley.coop/blog/5-fascinating-things-about-cows/\n  [72] https://pubmed.ncbi.nlm.nih.gov/40250611/\n  [73] https://www.sciencedirect.com/science/article/abs/pii/S0168159117302290\n  [74] https://christiannawroth.wordpress.com/2017/10/31/bovine-psychology-cows-experience-rich-emotional-and-cognitive-lives/\n  [75] https://www.researchgate.net/publication/320771759_The_Psychology_of_Cows\n  [76] https://pubmed.ncbi.nlm.nih.gov/21132446/\n  [77] https://medium.com/the-coffeelicious/what-are-they-really-thinking-219f8b707cd2\n  [78] https://www.sciencedirect.com/science/article/abs/pii/S0168159101001629\n  [79] https://pmc.ncbi.nlm.nih.gov/articles/PMC9490023/\n  [80] https://www.nature.com/articles/s41598-020-63848-1\n  [81] https://pmc.ncbi.nlm.nih.gov/articles/PMC6383588/\n  [82] https://www.sciencedirect.com/science/article/pii/S0022030222007603\n  [83] https://www.journalofdairyscience.org/article/S0022-0302%2822%2900760-3/fulltext\n  [84] https://pubmed.ncbi.nlm.nih.gov/38825128/\n  [85] https://pmc.ncbi.nlm.nih.gov/articles/PMC9863767/\n  [86] https://onanimals.co.uk/2021/06/04/stress-responses-to-seperation-broken-cow-calf-bond/\n  [87] https://www.sciencedirect.com/science/article/pii/S0168159125000462\n  [88] https://www.freenature.nl/en/nieuws/2024/what-does-maternal-herd-cattle-look\n  [89] https://pmc.ncbi.nlm.nih.gov/articles/PMC7417353/\n  [90] https://czaw.org/resources/important-role-of-dominance-in-allogrooming-behaviour-in-beef-cattle/\n  [91] https://www.sciencedirect.com/science/article/abs/pii/S0168159116301447\n  [92] https://cosmosmagazine.com/nature/grooming-and-the-social-lives-of-cows/\n  [93] https://www.msdvetmanual.com/behavior/behavior-of-production-animals/behavior-of-cattle\n  [94] https://www.beefcentral.com/genetics/traits-that-predict-dominance-in-bulls-keys-to-understanding-herd-hierarchy/\n  [95] https://www.producer.com/livestock/bunt-actions-establish-herd-hierarchy/\n  [96] https://pmc.ncbi.nlm.nih.gov/articles/PMC2684096/\n  [97] https://pmc.ncbi.nlm.nih.gov/articles/PMC7693563/\n  [98] https://www.appliedanimalscience.org/article/S1080-7446%2815%2931095-0/fulltext\n  [99] https://extension.msstate.edu/publications/beef-cattle-grazing-management\n  [100] https://psfaculty.plantsciences.ucdavis.edu/gmcourse/text/Chapter3.htm",
                            "https://pmc.ncbi.nlm.nih.gov/articles/PMC6304694/\nhttps://www.ucl.ac.uk/news/2012/mar/dna-traces-cattle-back-small-herd-domesticated-around-10500-years-ago\nhttps://thoughtco.com/history-of-the-domestication-of-cows-170652\nhttps://www.sciencedirect.com/topics/agricultural-and-biological-sciences/bos\nhttps://www.fao.org/livestock-systems/global-distributions/cattle/en/\nhttps://www.animalbehaviorandcognition.org/uploads/journals/17/AB&C_2017_Vol4%284%29_Marino_Allen.pdf\nhttps://www.ers.usda.gov/topics/animal-products/cattle-beef/sector-at-a-glance\nhttps://ourworldindata.org/grapher/cattle-livestock-count-heads\nhttps://www.worldbank.org/en/topic/agriculture/brief/moving-towards-sustainability-the-livestock-sector-and-the-world-bank\nhttps://www.etymonline.com/word/cattle\nhttps://www.merriam-webster.com/dictionary/cattle\nhttps://en.wiktionary.org/wiki/cattle\nhttps://livestockconservancy.org/resources/animal-terms/\nhttps://cals.cornell.edu/nys-4-h-animal-science-programs/livestock/beef/beef-cattle-terms\nhttps://elmwoodstockfarm.com/cattle-vocabulary-101/\nhttps://www.gbif.org/species/2441022\nhttps://pubchem.ncbi.nlm.nih.gov/taxonomy/9913\nhttps://www.sciencedirect.com/science/article/pii/S1055790304002647\nhttps://bmcgenomics.biomedcentral.com/articles/10.1186/1471-2164-10-177\nhttps://sc.journals.umz.ac.ir/article_2990.html\nhttps://www.nature.com/articles/hdy201679\nhttps://evolution.berkeley.edu/evo-news/no-more-mystery-meat/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC3290115/\nhttps://www.nature.com/articles/s41598-023-39518-3\nhttps://journals.plos.org/plosone/article?id=10.1371/journal.pone.0209645\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC11922504/\nhttps://www.thoughtco.com/history-of-the-domestication-of-cows-170652\nhttps://academic.oup.com/mbe/article/27/1/1/1127118\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC4445560/\nhttps://archaeology.org/issues/july-august-2012/digs-discoveries/the-origins-of-domestic-cattle/\nhttps://www.nature.com/articles/s41467-018-04737-0\nhttps://www.pnas.org/doi/10.1073/pnas.0509210103\nhttps://www.inaturalist.org/guide_taxa/840616\nhttps://animaldiversity.org/accounts/Bos_taurus/\nhttps://a-z-animals.com/animals/cow/\nhttps://www.fao.org/4/t0095e/t0095e04.htm\nhttps://dpbck.ac.in/wp-content/uploads/2022/05/Livestock-farming-.pdf\nhttps://josera-agriculture.com/tips-tricks/barn-management/cattle-breeds/\nhttps://tejasranchfence.com/5-most-common-cattle-breeds-texas/\nhttps://www.vetvoice.com.au/articles/difference-between-beef-and-dairy-cattle/\nhttps://uwmril.wisc.edu/wp-content/uploads/sites/306/2021/08/1_TECH_1_CowIntroUdderAnatomy.pdf\nhttps://extension.umn.edu/dairy-nutrition/ruminant-digestive-system\nhttps://swandairy.com/one-stomach-four-chambers/\nhttps://vtechworks.lib.vt.edu/items/da383a13-d5fc-470f-a43b-77360cf99ea8\nhttps://extension.msstate.edu/publications/understanding-the-ruminant-animal-digestive-system\nhttps://www.sciencelearn.org.nz/image_maps/104-ruminant-digestion\nhttps://ansci.wsu.edu/2022/08/02/myth-cattle-have-four-stomachs/\nhttps://pubmed.ncbi.nlm.nih.gov/14450002/\nhttps://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2024.1271599/full\nhttps://www.sciencedirect.com/science/article/pii/S0022030281826926\nhttps://epakag.ucdavis.edu/livestock/factsheets/fs-live-AIP03-HeiferManagement.pdf\nhttps://beef-cattle.extension.org/how-long-can-i-keep-a-bull-and-at-what-age-can-a-young-bull-start-mating-cows/\nhttps://beef.unl.edu/faq/pregnant-cows/\nhttps://www.cattlemax.com/articles/understanding-cattle-gestation\nhttps://livestock.extension.wisc.edu/articles/three-stages-of-bovine-parturition/\nhttps://www.iowabeefcenter.org/calving/processdelivery.html\nhttps://www.merckvetmanual.com/management-and-nutrition/management-of-reproduction-cattle/management-of-calving-in-cattle\nhttps://extension.sdstate.edu/calving-dairy-cows-step-step\nhttps://agresearch.okstate.edu/facilities/ferguson-family-dairy-center/kindergarten-second-grade-lesson-plans/life-cycle-of-dairy-cattle.html\nhttps://education.rspca.org.uk/documents/1494931/0/FS%2BCattle%2BFactsheet.pdf\nhttps://sentientmedia.org/how-long-do-cows-live/\nhttps://pubmed.ncbi.nlm.nih.gov/18638138/\nhttps://boumatic.com/eu_en/expert-blog/look-through-the-eyes-of-a-cow/\nhttps://www.farmprogress.com/cattle-news/understanding-cattle-vision-and-hearing-can-improve-handling-efficiency\nhttps://www.srpublication.com/experience-cow-vision/\nhttps://www.journalofdairyscience.org/article/S0022-0302%2801%2974537-7/pdf\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC11538434/\nhttps://psycnet.apa.org/record/1983-29540-001\nhttps://www.dexterstoday.com/post/understanding-cattle-behavior-hearing-smell-taste-and-touch\nhttps://www.sciencedirect.com/science/article/abs/pii/S1558787822001216\nhttps://www.facebook.com/groups/DairyFarmingKenya/posts/7757301847666029/\nhttps://www.organicvalley.coop/blog/5-fascinating-things-about-cows/\nhttps://pubmed.ncbi.nlm.nih.gov/40250611/\nhttps://www.sciencedirect.com/science/article/abs/pii/S0168159117302290\nhttps://christiannawroth.wordpress.com/2017/10/31/bovine-psychology-cows-experience-rich-emotional-and-cognitive-lives/\nhttps://www.researchgate.net/publication/320771759_The_Psychology_of_Cows\nhttps://pubmed.ncbi.nlm.nih.gov/21132446/\nhttps://medium.com/the-coffeelicious/what-are-they-really-thinking-219f8b707cd2\nhttps://www.sciencedirect.com/science/article/abs/pii/S0168159101001629\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC9490023/\nhttps://www.nature.com/articles/s41598-020-63848-1\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC6383588/\nhttps://www.sciencedirect.com/science/article/pii/S0022030222007603\nhttps://www.journalofdairyscience.org/article/S0022-0302%2822%2900760-3/fulltext\nhttps://pubmed.ncbi.nlm.nih.gov/38825128/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC9863767/\nhttps://onanimals.co.uk/2021/06/04/stress-responses-to-seperation-broken-cow-calf-bond/\nhttps://www.sciencedirect.com/science/article/pii/S0168159125000462\nhttps://www.freenature.nl/en/nieuws/2024/what-does-maternal-herd-cattle-look\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC7417353/\nhttps://czaw.org/resources/important-role-of-dominance-in-allogrooming-behaviour-in-beef-cattle/\nhttps://www.sciencedirect.com/science/article/abs/pii/S0168159116301447\nhttps://cosmosmagazine.com/nature/grooming-and-the-social-lives-of-cows/\nhttps://www.msdvetmanual.com/behavior/behavior-of-production-animals/behavior-of-cattle\nhttps://www.beefcentral.com/genetics/traits-that-predict-dominance-in-bulls-keys-to-understanding-herd-hierarchy/\nhttps://www.producer.com/livestock/bunt-actions-establish-herd-hierarchy/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC2684096/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC7693563/\nhttps://www.appliedanimalscience.org/article/S1080-7446%2815%2931095-0/fulltext\nhttps://extension.msstate.edu/publications/beef-cattle-grazing-management\nhttps://psfaculty.plantsciences.ucdavis.edu/gmcourse/text/Chapter3.htm\nhttps://pubmed.ncbi.nlm.nih.gov/16775080/\nhttps://www.sciencedirect.com/science/article/pii/016815919090101I\nhttps://www.mdpi.com/2076-2615/11/10/2903\nhttps://www.sciencedirect.com/science/article/pii/S0168159124000248\nhttps://clear.ucdavis.edu/news/grass-roots-insight-study-uncovers-patterns-cattle-grazing-behavior\nhttps://www.thecattlesite.com/articles/3211/grazing-behaviour-affects-forage\nhttps://uknowledge.uky.edu/cgi/viewcontent.cgi?article=4077&context=igc\nhttps://www.grandin.com/references/gains.html\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC11405345/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC9512098/\nhttps://www.thecattlesite.com/articles/762/beef-cattle-breeds-and-biological-types\nhttps://www.morningagclips.com/temperament-scoring-cattle/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC4204639/\nhttps://extension.oregonstate.edu/catalog/how-temperament-affects-performance-quality-beef-cattle\nhttps://beef.unl.edu/chute-scoring-beef-cattle/\nhttps://kb.osu.edu/bitstreams/229dde5b-7ee5-42d3-993b-fbbc52e977ff/download\nhttps://www.nature.com/articles/s41598-025-09983-z\nhttps://academic.oup.com/jas/article/100/10/skac233/6623940\nhttps://www.journalofdairyscience.org/article/S0022-0302%2820%2930885-7/fulltext\nhttps://www.sciencedirect.com/science/article/abs/pii/S0376635716302704\nhttps://www.sciencedirect.com/science/article/pii/S0022030219303145\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC5898734/\nhttps://ecommons.cornell.edu/bitstreams/a2a6e5fa-1133-4884-a0b8-f266d25190d8/download\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC9994596/\nhttps://www.sciencedirect.com/science/article/abs/pii/S0168159121000289\nhttps://www.journalofdairyscience.org/article/s0022-0302%2817%2930226-6/fulltext\nhttps://www.sciencedirect.com/science/article/abs/pii/S187114130900136X\nhttps://www.sciencedirect.com/science/article/abs/pii/S0378111924009776\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC6304682/\nhttps://www.nature.com/articles/s41598-020-71375-2\nhttps://bmcgenomics.biomedcentral.com/articles/10.1186/s12864-019-5822-y\nhttps://bmcgenomics.biomedcentral.com/articles/10.1186/s12864-020-07270-x\nhttps://www.nature.com/articles/s41467-022-28605-0\nhttps://academic.oup.com/jhered/article/109/2/103/4064635\nhttps://bmcgenomics.biomedcentral.com/articles/10.1186/s12864-024-09959-9\nhttps://www.ars.usda.gov/plains-area/miles-city-mt/larrl/docs/genetics-history/\nhttps://www.ans.iastate.edu/about/history/people/robert-bakewell\nhttps://www.mdpi.com/1424-2818/6/4/705\nhttps://thecanadianencyclopedia.ca/en/article/beef-cattle-farming\nhttps://www.morningagclips.com/the-original-ai-the-development-of-livestock-artificial-insemination/\nhttps://www.sciencedirect.com/science/article/pii/S0022030217310366\nhttps://www.absglobal.com/ca/company-2/about/history/\nhttps://www.isaaa.org/blog/entry/default.asp?BlogDate=3/1/2023\nhttps://utbeef.tennessee.edu/beef-cattle-breeding-and-reproduction/\nhttps://usacattlegenetics.com/national-genetic-evaluations/history-of-evaluation/\nhttps://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2022.994466/full\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC11334705/\nhttps://www.agproud.com/articles/57412-genomic-testing-the-past-present-and-future\nhttps://www.frontiersin.org/journals/genome-editing/articles/10.3389/fgeed.2023.1272687/full\nhttps://www.nature.com/articles/s41587-019-0266-0\nhttps://www.bbc.com/news/science-environment-49962130\nhttps://www.mercurynews.com/2023/05/29/they-were-designed-to-be-safer-how-de-horned-cows-were-doomed/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC10828428/\nhttps://www.isaaa.org/kc/cropbiotechupdate/article/default.asp?ID=18234\nhttps://innovativegenomics.org/news/crispr-in-agriculture-2024/\nhttps://www.thebullvine.com/news/mit-shines-spotlight-on-crispr-a-new-era-for-cattle-genetics-and-climate-change-solutions/\nhttps://bmcgenomics.biomedcentral.com/articles/10.1186/s12864-025-11381-8\nhttps://www.sciencedirect.com/science/article/pii/S294979812500016X\nhttps://vetsci.org/DOIx.php?id=10.4142/jvs.23133\nhttps://www.sciencedirect.com/science/article/pii/S1751731121001385\nhttps://extension.umn.edu/pasture-based-dairy/grazing-and-pasture-management-cattle\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC6039332/\nhttps://blog.whiteoakpastures.com/blog/cattle-comparison-pasture-raised-grassfed-cattle-vs-feedlot-grain-finished-cattle\nhttps://kb.wisc.edu/dairynutrient/375fsc/48431\nhttps://ers.usda.gov/sites/default/files/_laserfiche/publications/105077/EIB-243.pdf?v=37283\nhttps://www.mdpi.com/2071-1050/15/13/10533\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC2935116/\nhttps://www.fb.org/market-intel/u-s-cattle-inventory-smallest-in-73-years\nhttps://worldpopulationreview.com/country-rankings/cattle-population-by-country\nhttps://www.nationalbeefwire.com/ranking-of-countries-with-the-most-cattle\nhttps://www.jsmcentral.org/article-info/Factors-Influencing-the-Growth-and-Development-of-Meat-Animals\nhttps://www.extension.iastate.edu/agdm/articles/schulz/SchJun22.html\nhttps://ruminants.ceva.pro/beef-market\nhttps://www.sciencedirect.com/science/article/pii/S2405844025001677\nhttps://www.merckvetmanual.com/management-and-nutrition/preventative-health-care-and-husbandry-of-beef-cattle/vaccination-programs-for-beef-cattle\nhttps://www.aphis.usda.gov/livestock-poultry-disease/cattle/bovine-brucellosis\nhttps://extension.psu.edu/causes-of-vaccine-failure-in-beef-cattle\nhttps://www.merckvetmanual.com/management-and-nutrition/preventative-health-care-and-husbandry-of-beef-cattle/parasite-control-in-beef-cattle\nhttps://www.purinamills.com/cattle-feed/education/detail/a-foundation-for-cattle-health-nutrition-vaccines-and-dewormers\nhttps://www.ndsu.edu/agriculture/extension/publications/preventive-herd-health-program-checklist-beef-producers\nhttps://www.aphis.usda.gov/livestock-poultry-disease/cattle\nhttps://www.uaex.uada.edu/farm-ranch/animals-forages/beef-cattle/bqa_field-_guide.pdf\nhttps://sullivan.tennessee.edu/wp-content/uploads/sites/196/2020/10/BCP-Chapter-08-Health-Management-of-Beef-Cattle.pdf\nhttps://grillio.com/blog/breeds-of-cattle/\nhttps://www.fas.usda.gov/data/production/commodity/0111000\nhttps://ourworldindata.org/meat-production\nhttps://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/cuts-of-beef/art-20043833\nhttps://fdc.nal.usda.gov/\nhttps://www.nutritionix.com/i/usda/beef-ground-80-lean-meat-20-fat-patty-cooked-broiled-100-g/ddee7106612289ddc21c13e7\nhttps://www.ars.usda.gov/ARSUserFiles/80400525/data/beef/retail_beef_cuts02.pdf\nhttps://www.americandairy.com/dairy-diary/meet-the-dairy-cows-exploring-the-7-top-dairy-cow-breeds-in-the-u-s/\nhttps://ruminants.ceva.pro/dairy-cow-breeds\nhttps://www.milkingcloud.com/blog/most-preferred-cattle-breeds-milkingcloud/\nhttps://www.fao.org/dairy-production-products/production/milk-production/en\nhttps://www.developmentaid.org/news-stream/post/200444/top-10-countries-by-milk-production\nhttps://www.fas.usda.gov/data/production/commodity/0223000\nhttps://extension.psu.edu/value-added-agriculture-dairy-products/\nhttps://ruminants.ceva.pro/dairy-industry\nhttps://www.ers.usda.gov/data-products/charts-of-note/chart-detail?chartId=108228\nhttps://www.idfa.org/news/new-report-highlights-dairys-deep-economic-impact-in-communities-across-america\nhttps://www.midwestdairy.com/farm-life/dairy-cows/\nhttps://www.marketreportsworld.com/market-reports/bovine-leather-goods-market-14718862\nhttps://link.springer.com/article/10.1007/s43621-025-00798-6\nhttps://s.chooserealleather.com/wp-content/uploads/2023/03/Sustainability-Factsheets-Facts-and-figures.pdf\nhttps://lussoleather.com/blogs/guide/what-is-cowhide-leather\nhttps://www.ag.ndsu.edu:444/news/columns/spotlight-on-economics/spotlight-on-economics-byproduct-exports-important-to-cattle-prices\nhttps://auri.org/wp-content/uploads/2024/06/AURI-Brief3-SustainableUses_2.0_revise.pdf\nhttps://agupdate.com/theprairiestar/opinion/columnists/farm_and_ranch_life/cattle-s-importance-to-humans-throughout-history/article_faa71af7-fbad-54a5-aabd-4378e806cfca.html\nhttps://www.ox.ac.uk/news/2019-09-18-roots-inequality-traced-back-neolithic-ox-drawn-plows\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC8471664/\nhttps://www.sciencedirect.com/science/article/abs/pii/S016788090300118X\nhttps://smallfarms.cornell.edu/2012/06/working-oxen-on-the-farm-today/\nhttps://attra.ncat.org/publication/draft-animal-power-for-farming/\nhttps://www.drovers.com/news/beef-production/understanding-beef-product-values\nhttps://www.extension.iastate.edu/allamakee/files/documents/Lesson1Activity4Dairy_By_Products.pdf\nhttps://calfnews.net/industry-issues/beef-byproducts-more-than-drop/\nhttps://www.thebeefsite.com/articles/3044/wheres-the-not-meat-byproducts-from-beef-and-pork\nhttps://www.audubon.org/magazine/how-cattle-ranchers-are-helping-save-western-grasslands-and-birds\nhttps://pubs.nmsu.edu/_circulars/CR686/\nhttps://esajournals.onlinelibrary.wiley.com/doi/10.1002/ecs2.4859\nhttps://www.ars.usda.gov/news-events/news/research-news/2024/ars-scientists-discover-strategically-applied-livestock-grazing-can-benefit-sagebrush-communities/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC9763128/\nhttps://www.sciencedirect.com/science/article/abs/pii/S0301479723005571\nhttps://www.ebparks.org/natural-resources/grazing/benefits\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC8969921/\nhttps://www.frontiersin.org/journals/sustainable-food-systems/articles/10.3389/fsufs.2020.534187/full\nhttps://www.sciencedirect.com/science/article/abs/pii/S0167880925003949\nhttps://forceofnature.com/blogs/regenerate/carbon-sequestration\nhttps://stories.tamu.edu/news/2021/08/10/grazing-cattle-can-reduce-agricultures-carbon-footprint/\nhttps://civileats.com/2021/01/06/a-new-study-on-regenerative-grazing-complicates-climate-optimism/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC7435039/\nhttps://www.sciencedirect.com/science/article/abs/pii/S019005282100119X\nhttps://www.fao.org/family-farming/detail/en/c/1634679/\nhttps://www.fao.org/newsroom/detail/new-fao-report-maps-pathways-towards-lower-livestock-emissions/en\nhttps://thebreakthrough.org/issues/food-agriculture-environment/livestock-dont-contribute-14-5-of-global-greenhouse-gas-emissions\nhttps://clear.ucdavis.edu/news/climate-impacts-methane-are-overstated-according-review-new-research\nhttps://news.unl.edu/article/cattle-emissions-expert-environmental-impact-of-beef-has-been-overstated\nhttps://www.ilri.org/news/belching-bovines-and-global-warming-overstated-claims-about-methane-emitted-cows-and-climate\nhttps://www.theguardian.com/environment/2024/apr/19/un-livestock-emissions-report-seriously-distorted-our-work-say-experts\nhttps://www.climatechangenews.com/2024/08/14/fao-draft-report-backs-growth-of-livestock-industry-despite-emissions/\nhttps://clear.ucdavis.edu/explainers/cattle-and-land-use-differences-between-arable-land-and-marginal-land-and-how-cattle-use\nhttps://ourworldindata.org/environmental-impacts-of-food\nhttps://foodprint.org/issues/the-water-footprint-of-food/\nhttps://greenstarsproject.org/2025/01/19/the-environmental-footprints-of-meat-and-other-foods/\nhttps://drawdown.org/insights/regenerative-grazing-is-overhyped-as-a-climate-solution-we-should-do-it-anyway\nhttps://time.com/6835547/regenerative-cattle-farming/\nhttps://www.sciencedirect.com/science/article/pii/S0306456523002814\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC10668733/\nhttps://nwdistrict.ifas.ufl.edu/phag/2025/03/14/heat-stress-and-its-impact-on-cattle-reproduction/\nhttps://academic.oup.com/af/article/15/3/38/8223531\nhttps://agnext.colostate.edu/2024/11/05/bos-indicus-adaptions-for-heat-tolerance/\nhttps://www.sciencedirect.com/science/article/pii/S1871141321000652\nhttps://www.agproud.com/articles/57803-development-of-heat-tolerant-breeds-in-the-us\nhttps://www.neogen.com/en/usac/neocenter/blog/the-heat-resistant-cow-of-the-future/\nhttps://www.tandfonline.com/doi/full/10.1080/09712119.2025.2568562\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC7023624/\nhttps://www.farmprogress.com/livestock/beef-producers-breeding-for-heat-tolerance\nhttps://cabcattle.com/wp-content/uploads/HeatToleranceCattle.pdf\nhttps://www.beefresearch.ca/topics/nutritional-qualities-of-beef/\nhttps://foods.fatsecret.com/calories-nutrition/generic/milk-cows-fluid-whole?portionid=49474&portionamount=100.000\nhttps://www.healthline.com/nutrition/milk\nhttps://milk.co.uk/nutritional-composition-of-dairy/milk/\nhttps://www.frontiersin.org/journals/animal-science/articles/10.3389/fanim.2023.1142252/full\nhttps://nutritionfacts.org/blog/plant-versus-animal-iron/\nhttps://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/\nhttps://www.healthline.com/nutrition/vitamin-b12-foods\nhttps://openknowledge.fao.org/server/api/core/bitstreams/15b2eb21-16e5-49fa-ad79-9bcf0ecce88b/content\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC6951902/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC6736101/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC6434678/\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC9556326/\nhttps://www.health.harvard.edu/staying-healthy/whats-the-beef-with-red-meat\nhttps://pubmed.ncbi.nlm.nih.gov/37264855/\nhttps://www.acpjournals.org/doi/10.7326/M19-0655\nhttps://www.mayoclinic.org/diseases-conditions/heart-disease/expert-answers/grass-fed-beef/faq-20058059\nhttps://www.sciencedirect.com/science/article/pii/S1751731120001652\nhttps://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2025.1513368/full\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC7222824/\nhttps://www.sciencedirect.com/science/article/pii/S1751731116001336\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC11385012/\nhttps://www.avma.org/sites/default/files/resources/dehorning_cattle_bgnd.pdf\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC9929155/\nhttps://www.cambridge.org/core/journals/animal-welfare/article/efficacy-of-pain-management-for-cattle-castration-a-systematic-review-and-metaanalysis/4D9C403E2865D4048FCCEB18F07F714E\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC7094284/\nhttps://www.journalofdairyscience.org/article/S0022-0302%2823%2900640-9/fulltext\nhttps://www.sciencedirect.com/science/article/pii/S0168159122000508\nhttps://www.journalofdairyscience.org/article/S0022-0302%2823%2900741-5/fulltext\nhttps://www.tandfonline.com/doi/full/10.1080/1828051X.2022.2038038\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC6162402/\nhttps://www.ecfr.gov/current/title-9/chapter-III/subchapter-A/part-313\nhttps://pmc.ncbi.nlm.nih.gov/articles/PMC7134563/\nhttps://www.sciencedirect.com/science/article/pii/S1751731123003269\nhttps://efsa.onlinelibrary.wiley.com/doi/full/10.2903/j.efsa.2025.9518\nhttps://www.dairyglobal.net/health-and-nutrition/health/comparing-dairy-cow-welfare-standards-across-europe/\nhttps://www.britannica.com/topic/Apis-Egyptian-deity\nhttps://egypt-museum.com/cows-bulls-in-ancient-egypt/\nhttps://hekint.org/2025/05/29/the-cow-in-culture-and-history/\nhttps://www.britannica.com/topic/sanctity-of-the-cow\nhttps://theconversation.com/hinduism-and-its-complicated-history-with-cows-and-people-who-eat-them-80586\nhttps://people.uncw.edu/ricej/intro/indiasacredcow.pdf\nhttps://www.enjoy-irish-culture.com/ancient-ireland-celts-and-cattle.html\nhttp://journals.laikipia.ac.ke/index.php/jsseh/article/view/28/32\nhttps://issafrica.org/iss-today/cattle-rustling-from-cultural-practice-to-deadly-organised-crime\nhttps://www.choice360.org/choice-pick/cattle-in-history-culture-and-thought-part-1-october-2025/"
                        ],
                        "2": [
                            "Certain breeds of cattle, such as the Holstein-Friesian, are used to produce milk, much of which is processed into dairy products such as butter, cheese, and yogurt. Dairy cattle are usually kept on specialized dairy farms designed for milk production. Most cows are milked twice per day, with milk processed at a dairy, which may be onsite at the farm or the milk may be shipped to a dairy plant for eventual sale of a dairy product. Lactation is induced in heifers and spayed cows by a combination of physical and psychological stimulation, by drugs, or by a combination of those methods. For mother cows to continue producing milk, they give birth to one calf per year. If the calf is male, it is generally slaughtered at a young age to produce veal. Cows produce milk until three weeks before birth. Over the last fifty years, dairy farming has become more intensive to increase the yield of milk produced by each cow. The Holstein-Friesian is the breed of dairy cow most common in the UK, Europe and the United States. It has been bred selectively to produce the highest yields of milk of any cow. The average in the UK is around 22 litres per day.\nDairy is a large industry worldwide. In 2023, the 27 European Union countries produced 143 million tons of cow's milk; the United States 104.1 million tons; and India 99.5 million tons. India further produces 94.4 million tons of buffalo milk, making it (in 2023) the world's largest milk producer; its dairy industry employs some 80 million people.",
                            "Cattle hides represent the primary raw material for the global leather industry, with bovine hides accounting for approximately 70% of finished leather production worldwide. In 2023, global bovine hide production exceeded 6.4 million metric tons, derived from the slaughter of around 270 million cattle annually, of which about 70% of hides are processed into leather.[203][204] These hides, typically weighing 25 kilograms each, are tanned through processes involving chemicals like chromium salts to produce durable materials used in footwear, upholstery, clothing, and accessories such as belts and wallets.[205][206] Economically, hides contribute significantly to the beef industry's revenue, often comprising nearly half of total byproduct value and helping to offset meat production costs by utilizing otherwise discarded material.[207][208]\nCattle, particularly castrated males known as oxen, have served as draft animals for millennia, pulling plows, carts, and other implements in agriculture and transport. Domesticated around 10,000 years ago, they enabled the expansion of arable land by allowing a single team to cultivate up to ten times more area than hand tools alone, contributing to Neolithic agricultural intensification and social stratification in Eurasia.[209][210] In modern contexts, draft cattle remain prevalent in regions with limited mechanization, such as parts of Asia, Africa, and Latin America, where oxen are used for plowing wet fields with less soil compaction than tractors and for carting goods.[211][212] Globally, draft animals number in the hundreds of millions, with oxen being the most common for plowing tasks, though their use has declined in industrialized nations like the United States, where they persist on small-scale organic farms for tasks including tillage and manure spreading due to low maintenance costs compared to machinery.[212][213][214]\nBeyond leather and draft roles, cattle yield numerous byproducts from slaughter, enhancing overall economic viability by capturing value from non-carcass components that account for 10-15% of a steer's liveweight value, averaging about $11.77 per hundredweight over recent years.[215] Key byproducts include tallow (rendered fat) for soaps, candles, and biofuels; bones for gelatin, bone meal fertilizers, and surgical implants; blood for plasma proteins and fertilizers; and offal such as organs for pet food, pharmaceuticals (e.g., heparin from lungs, insulin precursors from pancreas), and edible items like tongues and livers.[215][216][217] These materials support industries from cosmetics to medicine, with hides alone often representing the largest share of byproduct revenue, underscoring cattle's role in resource-efficient production systems.[207][218]",
                            "Cattle, particularly specialized dairy breeds, supply the majority of the world's milk used in dairy products. The Holstein-Friesian breed predominates in commercial dairy operations due to its superior milk volume, with typical annual yields exceeding 10,000 kilograms per cow in high-input systems.[192] Other key breeds include Jersey, valued for higher milk fat content (around 5%) despite lower volume, and Brown Swiss, noted for protein-rich milk suitable for cheese production.[193] Yields vary by management, nutrition, and genetics; for instance, elite Holsteins can produce up to 53 liters daily under optimal conditions, though averages in the United States hover around 28-30 liters per day per cow.[194]\nGlobal cow's milk production drives the dairy sector, reaching approximately 750-800 million tonnes annually as of 2023, constituting over 80% of total mammalian milk output.[195] In 2024, overall world milk production hit 982 million tonnes, with growth led by Asia and supported by improved genetics and feed efficiency in developed regions.[196] The United States alone produced 102 million tonnes of cow's milk in recent years, emphasizing industrialized farming with automated milking.[197] Processing transforms raw milk into value-added products: fluid milk (pasteurized and homogenized), cheese (coagulating casein with rennet, yielding about 1 kg from 10 liters), butter (churning cream for fat separation), yogurt (fermentation with lactic acid bacteria), and powdered milk (spray-drying for shelf stability).[198]\nTop Cow's Milk Producing Countries (million tonnes, approximate recent data)\nUnited States: 102\nIndia (cow's milk portion): ~100\nChina: 42\nBrazil: 33\nRussia: 34\nThese figures reflect cow-specific output, excluding buffalo milk prevalent in parts of Asia; India's total milk lead includes significant non-cow contributions.[199] [197]\nEconomically, dairy from cattle underpins a market valued at nearly $992 billion in 2024, with U.S. milk production alone generating $59 billion in 2022 through farm-gate sales and processing.[196] [200] Value-added items like cheese and butter command premiums due to longer shelf life and concentrated nutrients, amplifying returns; for example, cheese production utilizes excess milk during high-supply periods to stabilize markets.[201] Innovations in breeding and feed have tripled per-cow yields since the mid-20th century, enhancing efficiency despite debates over input costs and sustainability.[202]"
                        ],
                        "3": [
                            "Cattle live in a dominance hierarchy. This is maintained in several ways. Cattle often engage in mock fights where they test each other's strength in a non-aggressive way. Licking is primarily performed by subordinates and received by dominant animals. Mounting is a playful behavior shown by calves of both sexes and by bulls and sometimes by cows in estrus, however, this is not a dominance related behavior as has been found in other species. Dominance-associated aggressiveness does not correlate with rank position, but is closely related to rank distance between individuals. The horns of cattle are used in mate selection. Horned cattle attempt to keep greater distances between themselves and have fewer physical interactions than hornless cattle, resulting in more stable social relationships. In calves, agonistic behavior becomes less frequent as space allowance increases, but not as group size changes, whereas in adults, the number of agonistic encounters increases with group size.\nDominance relationships in semi-wild highland cattle are very firm, with few overt aggressive conflicts: most disputes are settled by agonistic (non-aggressive, competitive) behaviors with no physical contact between opponents, reducing the risk of injury. Dominance status depends on age and sex, with older animals usually dominant to young ones and males dominant to females. Young bulls gain superior dominance status over adult cows when they reach about 2 years of age.",
                            "Cattle possess a wide field of vision spanning approximately 330 degrees, enabling panoramic awareness of their surroundings, which extends to nearly 360 degrees during grazing due to head positioning.[63] This monocular-dominant setup contributes to limited binocular overlap and poor depth perception, causing hesitation at shadows, contrasts, or unfamiliar visual cues.[64] Bovines exhibit dichromatic color vision, distinguishing blues and yellows effectively while perceiving reds and greens primarily as shades of gray or muted tones, with difficulty differentiating green from blue.[65][66]\nAuditory capabilities in cattle encompass a broad frequency range from 23 Hz to 35–37 kHz, surpassing human limits (typically 20 Hz to 20 kHz) and including heightened sensitivity to high frequencies up to 8,000 Hz.[67][68][69] This acuity allows detection of distant calls or mechanical noises that may elicit stress responses, though Bos indicus breeds show greater reactivity to both low and high frequencies compared to Bos taurus.[70]\nOlfaction serves critical functions in foraging, predator avoidance, mate selection, and social hierarchy maintenance, with cattle detecting odors up to 6 miles away via approximately 1,071 olfactory receptors.[71][72][69] Experimental evidence confirms discrimination between complex nonsocial odors, such as coffee and orange juice, indicating functional odor categorization beyond mere detection.[73][74] Taste integrates with smell for feed selection, though empirical data emphasize olfactory primacy in palatability assessment.[69]\nCognitively, cattle demonstrate associative learning in maze navigation and operant conditioning tasks, retaining spatial memories for resource locations over extended periods, up to one year in some cases.[75][76] Social cognition includes individual recognition of conspecifics via facial features from varied angles and distances, persisting for months, as well as discrimination of familiar versus unfamiliar herd members.[77][78] Cattle also visually distinguish humans using cues like facial structure or height, even under consistent clothing, underscoring cross-species recognition capacities.[79] Problem-solving appears limited in novel spatial detours, with evidence against reliance on social learning mechanisms for such tasks, though motivation for learning persists across individuals.[80][81] These abilities reflect adaptive responses to environmental and social pressures rather than abstract reasoning comparable to primates.[6][82]",
                            "Cattle form stable, matrilineal herds characterized by linear dominance hierarchies, primarily among females, which reduce agonistic interactions and determine priority access to resources such as feed and resting sites.[83] These hierarchies are established through agonistic behaviors including butting, pushing, and displacement, with higher-ranking individuals exhibiting fewer defeats and more wins in pairwise encounters.[83] Dominance rank in cows correlates positively with age, body size, parity (number of calves borne), and milk yield, though environmental factors like group stability and resource availability can modulate hierarchy steepness; for instance, increased competition flattens hierarchies by promoting more frequent rank reversals.[84] [85]\nMaternal bonds form rapidly post-partum, with cows recognizing and grooming their calves within hours, facilitated by olfactory cues from amniotic fluid and vocal exchanges; this bonding supports calf survival through nursing and protection, while separation disrupts both parties' behaviors, elevating cortisol levels and vocalizations indicative of stress.[86] [87] Calves reared in cow-calf contact systems display enhanced social motivation, preferring affiliation with conspecifics over isolation and forming stronger bonds with peers, which contrasts with individually housed calves that show reduced sociability.[88] In matriarchal groups, female kin clusters persist across generations, with offspring inheriting proximity to their mother's network, fostering herd cohesion.[89]\nAffiliative behaviors, such as allogrooming—reciprocal licking primarily around the head and neck—reinforce social ties and alleviate tension, with dominant cows initiating more grooming bouts and preferring recipients of similar age or kinship to maintain hierarchy stability.[90] [91] Allogrooming frequency peaks in stable herds, serving hygienic, physiological (e.g., endorphin release), and relational functions, though its absence in high-density or disrupted groups correlates with elevated aggression.[92] [93]\nBulls establish dominance over females and among peers via aggressive displays like chin-rubbing, bellowing, and sparring, with rank determined by physical traits (e.g., body mass, horn length) and behavioral factors (e.g., aggression, social experience); mature bulls often lead bachelor groups or defend harems in extensive systems, while subordination induces chronic stress in confined settings.[94] [95] In mixed-sex herds, bull presence intensifies female hierarchies but suppresses overt cow-cow aggression through sexual monopolization.[96]"
                        ],
                        "4": [
                            "Cattle grazing, when managed strategically such as through rotational or holistic planned methods, mimics the ecological role of wild herbivores like bison, preventing woody plant encroachment and maintaining open grassland structures essential for native flora and fauna.[219][220] In sagebrush ecosystems, targeted grazing reduces fine fuels, thereby lowering wildfire probability and severity; a 2024 study in the Great Basin found that such practices decreased invasive annual grass cover by up to 50% while enhancing native perennial bunchgrasses.[221][222]\nGrazing promotes biodiversity by creating heterogeneous vegetation patches that support diverse invertebrate, bird, and small mammal communities; low-intensity mixed grazing with cattle and sheep has been shown to increase taxonomic richness across multiple trophic levels in European grasslands.[223][224] Cattle selectively consume dominant grasses, suppressing competitive species and allowing subordinate plants to thrive, as evidenced in Hungarian studies where native Grey cattle maintained habitat mosaics conducive to rare orchids and insects.[220] This dynamic disturbance regime fosters ecosystem resilience, contrasting with ungrazed areas that succumb to uniform dominance by few species or invasives.[225]\nNutrient cycling from cattle manure enhances soil fertility and structure; long-term grazing elevates soil phosphorus, pH, and organic matter content while improving water infiltration and reducing erosion in forested and prairie soils.[226][227] In regenerative systems, these inputs, combined with trampling that incorporates litter into soil, boost microbial activity and aggregate stability, with seasonal grazing further amplifying biological indicators like earthworm abundance.[228]\nRegenerative grazing practices enable carbon sequestration by stimulating root growth and belowground biomass accumulation; field trials report sequestration rates of up to 3.6 tons of carbon per hectare annually in multi-species rotational pastures, offsetting enteric methane emissions and contributing to net greenhouse gas reductions.[229][230] However, these benefits accrue primarily under adaptive management that avoids overgrazing, with soil carbon gains verified through repeated sampling rather than modeled projections alone.[231][232] Overall, cattle in well-managed grazing systems provide ecosystem services including habitat provision and wildfire mitigation, supporting broader conservation goals in rangelands.[233]",
                            "![Cattle feedlot in New Mexico, United States][float-right] Cattle management systems vary globally based on production objectives, land availability, and economic factors, encompassing extensive grazing, rotational pasture systems, and intensive feedlot operations. Extensive systems, common in regions like Australia and parts of Africa, involve low-density grazing on natural rangelands with minimal supplemental feed, supporting cow-calf production where calves are raised to weaning before sale or transfer.[161] These systems leverage large land areas, with global cattle distributions showing concentrations in rangeland-heavy areas as mapped by FAO data from 2020.[5] In contrast, intensive rotational grazing divides pastures into paddocks, rotating herds to allow forage regrowth, which can increase productivity over continuous grazing by 20-50% through better utilization and soil health.[162]\nFeedlot systems, prevalent for beef finishing in the United States, confine cattle at high densities for 90-120 days on high-energy grain diets to achieve rapid weight gain of 1.5-1.8 kg per day, compared to 0.5-0.8 kg on pasture.[161] In the US, approximately 77% of cattle are finished in feedlots with capacities exceeding 1,000 head, enabling efficient scaling but requiring substantial inputs like water and feed.[163] Dairy management often integrates confinement housing with controlled feeding, though pasture-based variants exist; for instance, rotational systems in Europe and New Zealand optimize milk yields while reducing feed costs by up to 30%.[162]\nComparisons reveal trade-offs: pasture systems enhance soil aeration and biodiversity via managed grazing, potentially sequestering carbon, yet demand more land per unit output.[164] Feedlots minimize land use and accelerate production cycles, lowering per-unit costs, but generate concentrated manure requiring management to mitigate nutrient runoff.[161] Empirical data indicate feedlot beef may have lower overall greenhouse gas emissions per kilogram due to faster growth, though pasture systems score higher on metrics like omega-3 fatty acid content in meat.[165] Adoption of intensive rotational grazing has grown, with USDA reporting increased use in cow-calf operations for improved forage efficiency since the early 2000s.[166]",
                            "Livestock, particularly cattle, contribute significantly to global greenhouse gas emissions primarily through methane from enteric fermentation in ruminants and nitrous oxide from manure management. According to a 2013 Food and Agriculture Organization (FAO) assessment, livestock supply chains account for 14.5% of anthropogenic GHG emissions, with cattle responsible for about 62% of that sector's total, equating to roughly 3.8 GtCO2 equivalent annually.[234] [235] More recent FAO estimates have revised this downward to around 12% globally, reflecting refinements in measurement methodologies.[236] These figures, however, remain contested; critics argue that the 100-year global warming potential (GWP100) metric overstates methane's long-term impact, as it degrades faster than CO2, and alternative metrics like GWP* better capture short-lived pollutants' effects on warming rates.[237] In the U.S., for instance, livestock emissions represent only 4% of total GHGs, dwarfed by transportation and energy sectors.[238]\nDebates intensify over attribution and comparability, with some analyses suggesting livestock emissions have been exaggerated relative to fossil fuels or embedded emissions in plant-based alternatives, such as synthetic nitrogen fertilizers for crops.[239] FAO reports, while influential, face accusations of methodological inconsistencies and potential influence from agricultural lobbies, leading to underestimation of meat reduction benefits in some critiques, though others highlight systemic biases in anti-livestock narratives from environmental advocacy groups.[240] [241] Cattle's role is further contextualized by their use of marginal lands unsuitable for crops, converting inedible biomass into nutrient-dense food without direct competition with human edibles.[242]\nResource demands amplify these discussions: beef production requires substantial land and water, with global agrifood systems (including livestock) occupying half of habitable land and consuming 70% of freshwater.[243] A pound of beef demands approximately 1,800 gallons of water, predominantly for irrigating feed crops like soy and corn, far exceeding grains or vegetables but comparable in efficiency to some dairy when accounting for nutritional density.[244] Land use for beef can reach 52 times that of eggs or 94 times tofu per kilogram protein equivalent, yet this overlooks cattle's ability to graze non-arable pastures, potentially enhancing biodiversity and soil health under managed systems.[245]\nMitigation strategies, such as regenerative grazing—rotational paddock management mimicking natural herd movements—offer potential offsets by boosting soil carbon sequestration at rates up to 2.29 megagrams per hectare annually in some studies, reducing net emissions through improved microbial activity and organic matter buildup.[231] [230] However, scalability remains debated, with evidence mixed on whether such practices achieve atmospheric-level drawdown or merely local soil improvements, and some reviews caution against overhype amid variable outcomes across climates.[246] Intensive feedlot systems, conversely, concentrate emissions but enable efficiency gains via feed additives like seaweed that cut methane by up to 80% in trials, highlighting production method's causal role over blanket vilification of cattle.[247] Overall, while cattle husbandry entails verifiable environmental costs, causal assessments emphasize system-specific optimizations over aggregate demonization, prioritizing empirical trade-offs in food security and land stewardship."
                        ],
                        "5": [
                            "The gestation period for a cow is about nine months long. The ratio of male to female offspring at birth is approximately 52:48. A cow's udder has two pairs of mammary glands or teats. Farms often use artificial insemination, the artificial deposition of semen in the female's genital tract; this allows farmers to choose from a wide range of bulls to breed their cattle. Estrus too may be artificially induced to facilitate the process. Copulation lasts several seconds and consists of a single pelvic thrust.\nCows seek secluded areas for calving. Semi-wild Highland cattle heifers first give birth at 2 or 3 years of age, and the timing of birth is synchronized with increases in natural food quality. Average calving interval is 391 days, and calving mortality within the first year of life is 5%. Beef calves suckle an average of 5 times per day, spending some 46 minutes suckling. There is a diurnal rhythm in suckling, peaking at roughly 6am, 11:30am, and 7pm. Under natural conditions, calves stay with their mother until weaning at 8 to 11 months. Heifer and bull calves are equally attached to their mothers in the first few months of life.",
                            "Cattle husbandry practices including branding, castration, dehorning, ear tagging, nose ringing, restraint, tail docking, the use of veal crates, and cattle prods have raised welfare concerns.\nStocking density is the number of animals within a specified area. High stocking density can affect cattle health, welfare, productivity, and feeding behaviour. Densely-stocked cattle feed more rapidly and lie down sooner, increasing the risk of teat infection, mastitis, and embryo loss. The stress and negative health impacts induced by high stocking density such as in concentrated animal feeding operations or feedlots, auctions, and transport may be detrimental to cattle welfare.\nTo produce milk, most calves are separated from their mothers soon after birth and fed milk replacement to retain the cows' milk for human consumption. Dairy cattle are frequently artificially inseminated. Animal welfare advocates are critical of this practice, stating that this breaks the natural bond between the mother and her calf. The welfare of veal calves is also a concern.\nTwo sports involving cattle are thought to be cruel by animal welfare groups: rodeos and bullfighting. Such groups oppose rodeo activities including bull riding, calf roping and steer roping, stating that rodeos are unnecessary and cause stress, injury, and death to the animals. In Spain, the Running of the bulls faces opposition due to the stress and injuries incurred by the bulls during the event.",
                            "Health maintenance in cattle involves systematic preventive measures to minimize disease incidence, optimize productivity, and ensure animal welfare through veterinary oversight, biosecurity protocols, and targeted interventions. Core components include vaccination schedules tailored to regional risks, parasite control programs, nutritional balancing, and routine monitoring, often coordinated via herd health plans developed with licensed veterinarians. These practices reduce mortality rates, which can exceed 2-5% in untreated herds due to infectious diseases, and mitigate economic losses from treatment and reduced gains.\nVaccination programs form the foundation of disease prevention, targeting bacterial and viral pathogens prevalent in beef and dairy operations. Common regimens include modified-live or killed vaccines against clostridial diseases (e.g., blackleg, malignant edema), bovine respiratory disease complex (IBR, BVD, PI3, BRSV), leptospirosis, and campylobacteriosis, administered to calves at branding (2-4 months) and boosted pre-breeding or weaning. Brucellosis vaccination with RB51 strain is mandatory in endemic areas for heifers aged 4-12 months to curb zoonotic transmission, as enforced by USDA protocols. Efficacy depends on proper timing, storage at 2-8°C, and animal condition; failures often stem from maternal antibody interference in young calves or nutritional deficits impairing immune response.[176][177][178]\nParasite management addresses internal helminths (e.g., Ostertagia, Cooperia species) and external threats like ticks (Rhipicephalus, Amblyomma) and flies, which transmit anaplasmosis and cause anemia or hide damage. Integrated strategies combine pasture rotation to break life cycles, strategic deworming with anthelmintics like ivermectin or fenbendazole based on fecal egg counts, and topical acaricides or ear tags for ectoparasites. Selective treatment of high-shedders in adult cattle preserves efficacy against growing resistance, with older animals often requiring less intervention due to acquired immunity. Environmental hygiene, such as removing manure accumulations, further limits reinfestation.[179][180]\nNutritional adequacy supports immune function and prevents metabolic disorders like hypocalcemia or grass tetany. Diets must provide balanced energy, protein, and trace minerals (e.g., selenium, copper, zinc) via forages, supplements, or licks, with body condition scoring (1-9 scale) guiding adjustments—targeting 5-6 at calving for cows. Deficiencies, common in selenium-poor soils, exacerbate vaccine underperformance and increase susceptibility to respiratory or neonatal diseases; testing forages and bloodwork informs supplementation. Water quality and access are critical, as dehydration impairs rumen function and nutrient uptake.[176][181]\nBiosecurity and facility management prevent introductions of reportable diseases like bovine tuberculosis or foot-and-mouth disease. Protocols mandate quarantining new stock for 30-60 days with testing, vehicle disinfection, and restricted access to limit fomites. Routine practices include hoof trimming to avert lameness (affecting 10-20% of dairy herds annually), clean calving areas to reduce scours in neonates, and prompt treatment of injuries using crushes for restraint. Record-keeping of treatments ensures compliance with withdrawal periods for residues, while genetic selection for disease resistance enhances long-term resilience.[182][183][184]"
                        ],
                        "6": [
                            "![Charolais bull][float-right] Cattle (Bos taurus and Bos indicus) are large, quadrupedal ungulates characterized by cloven hooves and a robust body structure adapted for grazing.[33] Their build features a relatively small head, strong neck, and bulky torso supported by sturdy limbs, with body size varying significantly by breed and sex. Mature females generally weigh 360–1,100 kg and stand 1.2–1.5 m at the shoulder, while males are larger, often reaching 450–1,800 kg and up to 1.8 m in height for breeds like Chianina.[34] [35]\nSexual dimorphism is pronounced, with bulls exhibiting thicker necks, broader shoulders, and more muscular frames compared to cows.[4] Horns, when present, emerge from the sides of the head above the ears and curve upward or outward, serving roles in defense and mate selection; however, many modern breeds are polled through selective breeding.[36] [37] Coat color and pattern diversity includes solid black (e.g., Angus), red (e.g., Hereford), or spotted (e.g., Simmental), with short hair covering a thin, pigmented skin that varies in attachment and dewlap development.[38] [36]\nBreed-specific traits reflect purpose: beef cattle display compact, muscular bodies with even fat distribution for meat yield, averaging 1,000–1,300 pounds in breeds like Angus, whereas dairy cattle are leaner and more angular, prioritizing udder capacity over muscling.[39] [40] The bovine udder consists of four separate quarters, each with a teat, suspended in the inguinal region and highly developed in dairy breeds for milk production.[41] Bos indicus breeds additionally feature dorsal humps, loose skin folds, and longer ears for heat dissipation in tropical climates.[35]",
                            "Cattle face significant physiological challenges from heat stress, particularly in tropical and subtropical regions, where temperatures exceeding the thermoneutral zone impair productivity and welfare. Primary responses include elevated respiration rates, increased sweating, and reduced dry matter intake to minimize internal heat production, alongside behavioral shifts such as seeking shade and wallowing in mud to enhance evaporative cooling.[248][249] These adaptations help dissipate excess heat but can lead to decreased milk yield, fertility, and growth if prolonged.[250]\nBos indicus cattle, such as zebu breeds, exhibit superior heat tolerance compared to Bos taurus due to morphological and physiological traits including larger sweat glands, more effective sweating rates, pendulous dewlap and loose skin for better heat dissipation, and fat storage in humps that reduces body insulation.[251][252] In contrast, Bos taurus breeds from temperate origins struggle more with heat, showing higher body temperatures and metabolic stress.[253] Crossbreeds incorporating Bos indicus genetics, like Brahman-influenced composites (e.g., Brangus, Beefmaster, Santa Gertrudis), balance heat resilience with productivity, as seen in U.S. and Australian programs selecting for thermotolerance.[254][255]\nIndigenous and tropically adapted breeds, including Senepol, Tuli, and Mashona, demonstrate resilience to drought through efficient resource utilization, such as lower maintenance feed requirements and ability to thrive on poor-quality forage.[256][257] These traits stem from evolutionary pressures in harsh environments, enabling survival during feed shortages without significant productivity collapse, unlike temperate breeds.[258] Genetic selection programs increasingly target these adaptations, using indices for heat tolerance based on traits like skin thickness and coat color to mitigate climate variability impacts.[259]",
                            "Cattle temperament, often assessed through measures like exit velocity from handling chutes, agitation scores, and flight zone responses, exhibits significant genetic variation primarily between Bos taurus (European-derived) and Bos indicus (Zebu-influenced) lineages. Bos indicus cattle, adapted to tropical environments with higher predator pressure, display greater reactivity and excitability compared to Bos taurus breeds when subjected to human handling or novel stimuli, as evidenced by higher mean temperament scores (e.g., 3.45 vs. 1.80 on a 1-6 scale where 1 is docile) in Brahman-influenced animals versus non-influenced ones.[109][110] This difference stems from evolutionary pressures favoring heightened vigilance in Bos indicus, leading to behaviors such as increased balking, vocalization, and struggling during restraint, which can elevate stress hormones like cortisol by up to 50% more than in calmer Bos taurus counterparts.[111] Within Bos taurus, breeds like Charolais and Limousin show tendencies toward higher activity levels and later maturity, correlating with moderately elevated flightiness, though still less pronounced than in Bos indicus.[112]\nSex-based variations further modulate temperament, with bulls exhibiting markedly higher aggression levels than cows or steers across breeds, driven by testosterone influences that amplify charging, butting, and territorial displays, particularly post-puberty around 12-18 months of age.[94] Maternal cows, especially those with calves under 3 months, display protective aggression, charging intruders within a 5-10 meter radius, a behavior observed uniformly but more intensely in flighty breeds.[113] Selective breeding for docility, quantified via chute exit speeds under 1.5 m/s for calm animals, has reduced heritability estimates for excitability from 0.35 in unselected herds to lower values in modern lines, improving handling safety and feed efficiency by 10-15% in docile groups.[114] Controversially, certain breeds like the Spanish Fighting Bull (Toro Bravo) have been intentionally selected over centuries for combative traits, including low fear thresholds and persistent charging, resulting in injury rates to handlers exceeding 20% in traditional events, though this represents an outlier from commercial production goals favoring calm dispositions.[115]\nIndividual and environmental factors interact with genetic baselines; for instance, early weaning at 6-8 weeks can exacerbate excitability in Bos indicus crosses by 20-30% compared to Bos taurus, while consistent low-stress handling from birth mitigates inherited reactivity, as demonstrated in longitudinal studies tracking temperament scores from weaning to slaughter.[116] Overall, calmer temperaments correlate with superior carcass quality, including 5-10% higher marbling scores and lower dark-cutting incidence, underscoring economic incentives for breed substitution or crossbreeding toward Bos taurus dominance in temperate regions.[117][113]"
                        ]
                    }
                },
                "topic_count": 6,
                "grokipedia_topics": [
                    0,
                    -1,
                    -1,
                    0,
                    0,
                    0,
                    -1,
                    5,
                    3,
                    -1,
                    2,
                    -1,
                    2,
                    3,
                    5,
                    -1,
                    -1,
                    0,
                    0,
                    0,
                    -1,
                    3,
                    1,
                    4,
                    -1,
                    1,
                    1,
                    1,
                    -1,
                    3,
                    3,
                    5,
                    -1,
                    -1,
                    -1,
                    0,
                    0,
                    0
                ],
                "wikipedia_topics": [
                    0,
                    1,
                    -1,
                    -1,
                    -1,
                    4,
                    2,
                    2,
                    -1,
                    2,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    0,
                    0,
                    -1,
                    4,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    -1,
                    4,
                    -1,
                    -1,
                    -1,
                    3,
                    4,
                    -1,
                    -1,
                    -1,
                    -1,
                    0,
                    0
                ],
                "topic_divergence": 0.7368421052631579
            },
            "claim_alignment": {
                "total_claims_grokipedia": 1155,
                "total_claims_wikipedia": 800,
                "exact_matches": 1,
                "semantic_matches": 252,
                "total_aligned_claims": 253,
                "alignment_percentage": 21.904761904761905
            }
        },
        "factcheck": {
            "status": "success",
            "summary": {
                "total_contradictions": 4,
                "grok_claims_verified": 4,
                "wiki_claims_verified": 4
            },
            "metrics": {
                "grokipedia": {
                    "unsourced_claim_ratio": {
                        "unsourced_ratio": 0.0,
                        "unsourced_count": 0,
                        "sourced_count": 4,
                        "total_count": 4
                    },
                    "external_verification_score": {
                        "verification_score": 100.0,
                        "external_verification_score": 75.0,
                        "verified_count": 4,
                        "partially_verified_count": 0,
                        "unverified_count": 0,
                        "total_count": 4
                    },
                    "temporal_consistency": {
                        "inconsistencies": [
                            {
                                "type": "numeric",
                                "entity": "Cattle",
                                "issue": "Large numeric discrepancy: 1.0 vs 500.0",
                                "values": [
                                    "500 years",
                                    "10",
                                    "500",
                                    "1",
                                    "2",
                                    "3",
                                    "4",
                                    "5",
                                    "500 years",
                                    "10",
                                    "500",
                                    "1",
                                    "2",
                                    "3",
                                    "4",
                                    "5"
                                ]
                            },
                            {
                                "type": "numeric",
                                "entity": "which",
                                "issue": "Large numeric discrepancy: 2.0 vs 178.0",
                                "values": [
                                    "2",
                                    "8",
                                    "176",
                                    "177",
                                    "178",
                                    "73",
                                    "74",
                                    "69",
                                    "75",
                                    "76",
                                    "77",
                                    "78",
                                    "79",
                                    "80",
                                    "81",
                                    "6",
                                    "82",
                                    "83",
                                    "83",
                                    "84",
                                    "85",
                                    "86"
                                ]
                            }
                        ],
                        "inconsistency_count": 2,
                        "total_entities_checked": 2
                    },
                    "fabrication_risk_score": {
                        "fabrication_risk_score": 8.75,
                        "risk_level": "Very Low - Well-sourced",
                        "high_risk_claims": [],
                        "high_risk_count": 0,
                        "total_claims": 4
                    }
                },
                "wikipedia": {
                    "unsourced_claim_ratio": {
                        "unsourced_ratio": 100.0,
                        "unsourced_count": 4,
                        "sourced_count": 0,
                        "total_count": 4
                    },
                    "external_verification_score": {
                        "verification_score": 75.0,
                        "external_verification_score": 60.0,
                        "verified_count": 3,
                        "partially_verified_count": 0,
                        "unverified_count": 1,
                        "total_count": 4
                    },
                    "temporal_consistency": {
                        "inconsistencies": [
                            {
                                "type": "temporal",
                                "claim_id": "wiki_contradiction_4",
                                "claim_text": "which reduce the carrying capacity of the land",
                                "issue": "Temporal inconsistency detected in verification",
                                "verification_status": "unverified"
                            }
                        ],
                        "inconsistency_count": 1,
                        "total_entities_checked": 0
                    },
                    "fabrication_risk_score": {
                        "fabrication_risk_score": 37.5,
                        "risk_level": "Moderate - Some unverified claims",
                        "high_risk_claims": [
                            {
                                "claim_id": "wiki_contradiction_4",
                                "claim_text": "which reduce the carrying capacity of the land",
                                "risk_score": 80,
                                "factors": [
                                    "lack of context about carrying capacity",
                                    "no direct references found",
                                    "claim is not supported by the search results"
                                ]
                            }
                        ],
                        "high_risk_count": 1,
                        "total_claims": 4
                    }
                }
            },
            "contradictory_claims": {
                "total_pairs": 4,
                "pairs": [
                    {
                        "contradiction_number": 1,
                        "subject_predicate": "Cattle be",
                        "grok_object": "large quadrupedal ungulates",
                        "wiki_object": "large artiodactyls",
                        "grok_sentence": "Fact-checked by Grok yesterday\nCattle\nCattle are large domesticated ruminants belonging to the genus Bos, primarily the taurine (Bos taurus) and zebu (Bos indicus) lineages, which originated from independent domestication events of the wild aurochs (Bos primigenius) approximately 10,500 years ago in the Near East for taurine cattle and later in the Indus Valley for zebu cattle.[1][2][3] These animals, characterized by their cloven hooves, horns (in many breeds), and ruminant digestive systems enabling efficient fermentation of fibrous plant material, have been selectively bred over millennia into diverse types adapted to varied climates and production goals, from temperate dairy herds to tropical draft oxen.[4][5]",
                        "wiki_sentence": "Cattle (Bos taurus) are large, domesticated, bovid ungulates widely kept as livestock.",
                        "grok_claim": {
                            "claim_id": "grok_contradiction_1",
                            "source": "grokipedia",
                            "subject": "Cattle",
                            "predicate": "be",
                            "object": "large quadrupedal ungulates",
                            "sentence": "Fact-checked by Grok yesterday\nCattle\nCattle are large domesticated ruminants belonging to the genus Bos, primarily the taurine (Bos taurus) and zebu (Bos indicus) lineages, which originated from independent domestication events of the wild aurochs (Bos primigenius) approximately 10,500 years ago in the Near East for taurine cattle and later in the Indus Valley for zebu cattle.[1][2][3] These animals, characterized by their cloven hooves, horns (in many breeds), and ruminant digestive systems enabling efficient fermentation of fibrous plant material, have been selectively bred over millennia into diverse types adapted to varied climates and production goals, from temperate dairy herds to tropical draft oxen.[4][5]",
                            "claim_text": "Cattle be large quadrupedal ungulates",
                            "has_citation": true,
                            "citation_count": 5,
                            "extracted_dates": [],
                            "extracted_numbers": [
                                {
                                    "text": "500 years",
                                    "position": 284,
                                    "type": "number"
                                },
                                {
                                    "text": "10",
                                    "position": 281,
                                    "type": "number"
                                },
                                {
                                    "text": "500",
                                    "position": 284,
                                    "type": "number"
                                },
                                {
                                    "text": "1",
                                    "position": 381,
                                    "type": "number"
                                },
                                {
                                    "text": "2",
                                    "position": 384,
                                    "type": "number"
                                },
                                {
                                    "text": "3",
                                    "position": 387,
                                    "type": "number"
                                },
                                {
                                    "text": "4",
                                    "position": 718,
                                    "type": "number"
                                },
                                {
                                    "text": "5",
                                    "position": 721,
                                    "type": "number"
                                }
                            ],
                            "entities": [
                                "Cattle"
                            ]
                        },
                        "wiki_claim": {
                            "claim_id": "wiki_contradiction_1",
                            "source": "wikipedia",
                            "subject": "Cattle",
                            "predicate": "be",
                            "object": "large artiodactyls",
                            "sentence": "Cattle (Bos taurus) are large, domesticated, bovid ungulates widely kept as livestock.",
                            "claim_text": "Cattle be large artiodactyls",
                            "has_citation": false,
                            "citation_count": 0,
                            "extracted_dates": [],
                            "extracted_numbers": [],
                            "entities": [
                                "Cattle"
                            ]
                        },
                        "grok_verification": {
                            "verification_status": "verified",
                            "confidence_score": 0.95,
                            "verification_score": 95,
                            "external_verification_score": 90,
                            "sources_count": 2,
                            "sources": [
                                "https://www.sciencedaily.com/releases/2012/03/120327124243.htm",
                                "https://en.wikipedia.org/wiki/Cattle"
                            ],
                            "key_facts": [
                                "Cattle are large domesticated ruminants belonging to the genus Bos.",
                                "The primary lineages of cattle are taurine (Bos taurus) and zebu (Bos indicus).",
                                "Cattle are characterized by cloven hooves, horns, and ruminant digestive systems.",
                                "Taurine cattle domesticated approximately 10,500 years ago in the Near East.",
                                "Zebu cattle domesticated later in the Indus Valley."
                            ],
                            "analysis": "The claim that cattle are large quadrupedal ungulates is supported by authoritative sources, which confirm that cattle belong to the genus Bos, characterized by large size, domestication, and specific biological traits such as cloven hooves and ruminant digestive systems. The additional information on domestication and breeding practices further supports this classification.",
                            "temporal_consistency": true,
                            "fabrication_risk_score": 5,
                            "citation_present": true,
                            "hallucination_indicators": []
                        },
                        "wiki_verification": {
                            "verification_status": "verified",
                            "confidence_score": 1.0,
                            "verification_score": 100,
                            "external_verification_score": 60,
                            "sources_count": 3,
                            "sources": [
                                "https://en.wikipedia.org/wiki/Cattle?utm_source=openai",
                                "https://edis.ifas.ufl.edu/publication/AN267?utm_source=openai",
                                "https://www.purinamills.com/cattle-feed/education/detail/the-recipe-for-a-perfect-cattle-breeding-program?utm_source=openai"
                            ],
                            "key_facts": [
                                "Cattle are large, domesticated members of the Bovidae family.",
                                "Cattle are widely kept as livestock.",
                                "Cattle are used for meat, dairy products, leather, and as draft animals."
                            ],
                            "analysis": "The claim that cattle are large artiodactyls is verified as the sources confirm that cattle are large, domesticated bovid ungulates, known for their broad uses in agriculture. The provided evidence and sources consistently affirm the characteristics attributed to cattle in the claim.",
                            "temporal_consistency": true,
                            "fabrication_risk_score": 0,
                            "citation_present": true,
                            "hallucination_indicators": []
                        }
                    },
                    {
                        "contradiction_number": 2,
                        "subject_predicate": "Cattle be",
                        "grok_object": "large quadrupedal ungulates",
                        "wiki_object": "ruminants",
                        "grok_sentence": "Fact-checked by Grok yesterday\nCattle\nCattle are large domesticated ruminants belonging to the genus Bos, primarily the taurine (Bos taurus) and zebu (Bos indicus) lineages, which originated from independent domestication events of the wild aurochs (Bos primigenius) approximately 10,500 years ago in the Near East for taurine cattle and later in the Indus Valley for zebu cattle.[1][2][3] These animals, characterized by their cloven hooves, horns (in many breeds), and ruminant digestive systems enabling efficient fermentation of fibrous plant material, have been selectively bred over millennia into diverse types adapted to varied climates and production goals, from temperate dairy herds to tropical draft oxen.[4][5]",
                        "wiki_sentence": "=== Digestive system ===\n\nCattle are ruminants, meaning their digestive system is highly specialized for processing plant material such as grass rich in cellulose, a tough carbohydrate polymer which many animals cannot digest.",
                        "grok_claim": {
                            "claim_id": "grok_contradiction_2",
                            "source": "grokipedia",
                            "subject": "Cattle",
                            "predicate": "be",
                            "object": "large quadrupedal ungulates",
                            "sentence": "Fact-checked by Grok yesterday\nCattle\nCattle are large domesticated ruminants belonging to the genus Bos, primarily the taurine (Bos taurus) and zebu (Bos indicus) lineages, which originated from independent domestication events of the wild aurochs (Bos primigenius) approximately 10,500 years ago in the Near East for taurine cattle and later in the Indus Valley for zebu cattle.[1][2][3] These animals, characterized by their cloven hooves, horns (in many breeds), and ruminant digestive systems enabling efficient fermentation of fibrous plant material, have been selectively bred over millennia into diverse types adapted to varied climates and production goals, from temperate dairy herds to tropical draft oxen.[4][5]",
                            "claim_text": "Cattle be large quadrupedal ungulates",
                            "has_citation": true,
                            "citation_count": 5,
                            "extracted_dates": [],
                            "extracted_numbers": [
                                {
                                    "text": "500 years",
                                    "position": 284,
                                    "type": "number"
                                },
                                {
                                    "text": "10",
                                    "position": 281,
                                    "type": "number"
                                },
                                {
                                    "text": "500",
                                    "position": 284,
                                    "type": "number"
                                },
                                {
                                    "text": "1",
                                    "position": 381,
                                    "type": "number"
                                },
                                {
                                    "text": "2",
                                    "position": 384,
                                    "type": "number"
                                },
                                {
                                    "text": "3",
                                    "position": 387,
                                    "type": "number"
                                },
                                {
                                    "text": "4",
                                    "position": 718,
                                    "type": "number"
                                },
                                {
                                    "text": "5",
                                    "position": 721,
                                    "type": "number"
                                }
                            ],
                            "entities": [
                                "Cattle"
                            ]
                        },
                        "wiki_claim": {
                            "claim_id": "wiki_contradiction_2",
                            "source": "wikipedia",
                            "subject": "Cattle",
                            "predicate": "be",
                            "object": "ruminants",
                            "sentence": "=== Digestive system ===\n\nCattle are ruminants, meaning their digestive system is highly specialized for processing plant material such as grass rich in cellulose, a tough carbohydrate polymer which many animals cannot digest.",
                            "claim_text": "Cattle be ruminants",
                            "has_citation": false,
                            "citation_count": 0,
                            "extracted_dates": [],
                            "extracted_numbers": [],
                            "entities": [
                                "Cattle"
                            ]
                        },
                        "grok_verification": {
                            "verification_status": "verified",
                            "confidence_score": 1.0,
                            "verification_score": 100,
                            "external_verification_score": 90,
                            "sources_count": 2,
                            "sources": [
                                "https://en.wikipedia.org/wiki/Cattle?utm_source=openai",
                                "https://www.nhm.ac.uk/discover/from-aurochs-to-burgers.html?utm_source=openai"
                            ],
                            "key_facts": [
                                "Cattle are large domesticated ruminants belonging to the genus Bos.",
                                "Cattle include two primary lineages: taurine (Bos taurus) and zebu (Bos indicus).",
                                "Taurine cattle were domesticated approximately 10,500 years ago in the Near East.",
                                "Zebu cattle were domesticated around 9,000 years ago in the Indus Valley.",
                                "Cattle have cloven hooves and often have horns."
                            ],
                            "analysis": "The claim that cattle are large quadrupedal ungulates is supported by the web search results which confirm their characteristics as large domesticated animals of the genus Bos. They are indeed quadrupedal (having four limbs) and ungulates (hoofed animals). The provided sources corroborate the facts about their domestication, physical traits, and breeding practices, verifying the claim.",
                            "temporal_consistency": true,
                            "fabrication_risk_score": 0,
                            "citation_present": true,
                            "hallucination_indicators": []
                        },
                        "wiki_verification": {
                            "verification_status": "verified",
                            "confidence_score": 1.0,
                            "verification_score": 100,
                            "external_verification_score": 90,
                            "sources_count": 2,
                            "sources": [
                                "https://en.wikipedia.org/wiki/Cattle?utm_source=openai",
                                "https://en.wikipedia.org/wiki/Estrous_synchronization?utm_source=openai"
                            ],
                            "key_facts": [
                                "Cattle are ruminants with a four-compartment stomach.",
                                "The rumen, reticulum, omasum, and abomasum compartments help in digesting cellulose-rich materials.",
                                "Cattle's digestive efficiency is supported by a symbiotic relationship with microorganisms.",
                                "Cellulolytic bacteria such as Fibrobacter succinogenes, Ruminococcus flavefaciens, and Ruminococcus albus are present in the rumen."
                            ],
                            "analysis": "The claim that cattle are ruminants is verified through the detailed description of their specialized digestive system available in authoritative sources. They have a unique four-part stomach adapted for processing cellulose, which is a trait specific to ruminants. The presence of specific cellulolytic bacteria and a symbiotic relationship aiding in cellulose digestion further supports this claim.",
                            "temporal_consistency": true,
                            "fabrication_risk_score": 0,
                            "citation_present": true,
                            "hallucination_indicators": []
                        }
                    },
                    {
                        "contradiction_number": 3,
                        "subject_predicate": "which transmit",
                        "grok_object": "anaplasmosis",
                        "wiki_object": "diseases",
                        "grok_sentence": "Efficacy depends on proper timing, storage at 2-8°C, and animal condition; failures often stem from maternal antibody interference in young calves or nutritional deficits impairing immune response.[176][177][178]\nParasite management addresses internal helminths (e.g., Ostertagia, Cooperia species) and external threats like ticks (Rhipicephalus, Amblyomma) and flies, which transmit anaplasmosis and cause anemia or hide damage.",
                        "wiki_sentence": "== Health ==\n\n\n=== Pests and diseases ===\n\nCattle are subject to pests including arthropod parasites such as ticks (which can in turn transmit diseases caused by bacteria and protozoa), and diseases caused by pathogens including bacteria and viruses.",
                        "grok_claim": {
                            "claim_id": "grok_contradiction_3",
                            "source": "grokipedia",
                            "subject": "which",
                            "predicate": "transmit",
                            "object": "anaplasmosis",
                            "sentence": "Efficacy depends on proper timing, storage at 2-8°C, and animal condition; failures often stem from maternal antibody interference in young calves or nutritional deficits impairing immune response.[176][177][178]\nParasite management addresses internal helminths (e.g., Ostertagia, Cooperia species) and external threats like ticks (Rhipicephalus, Amblyomma) and flies, which transmit anaplasmosis and cause anemia or hide damage.",
                            "claim_text": "which transmit anaplasmosis",
                            "has_citation": true,
                            "citation_count": 3,
                            "extracted_dates": [],
                            "extracted_numbers": [
                                {
                                    "text": "2",
                                    "position": 46,
                                    "type": "number"
                                },
                                {
                                    "text": "8",
                                    "position": 48,
                                    "type": "number"
                                },
                                {
                                    "text": "176",
                                    "position": 198,
                                    "type": "number"
                                },
                                {
                                    "text": "177",
                                    "position": 203,
                                    "type": "number"
                                },
                                {
                                    "text": "178",
                                    "position": 208,
                                    "type": "number"
                                }
                            ],
                            "entities": [
                                "which"
                            ]
                        },
                        "wiki_claim": {
                            "claim_id": "wiki_contradiction_3",
                            "source": "wikipedia",
                            "subject": "which",
                            "predicate": "transmit",
                            "object": "diseases",
                            "sentence": "== Health ==\n\n\n=== Pests and diseases ===\n\nCattle are subject to pests including arthropod parasites such as ticks (which can in turn transmit diseases caused by bacteria and protozoa), and diseases caused by pathogens including bacteria and viruses.",
                            "claim_text": "which transmit diseases",
                            "has_citation": false,
                            "citation_count": 0,
                            "extracted_dates": [],
                            "extracted_numbers": [],
                            "entities": [
                                "which"
                            ]
                        },
                        "grok_verification": {
                            "verification_status": "verified",
                            "confidence_score": 0.9,
                            "verification_score": 90,
                            "external_verification_score": 60,
                            "sources_count": 3,
                            "sources": [
                                "https://canr.msu.edu/news/controlling-external-parasites-on-cattle?utm_source=openai",
                                "https://secure.caes.uga.edu/extension/publications/files/pdf/B%201086_2.PDF?utm_source=openai",
                                "https://www.vet.cornell.edu/animal-health-diagnostic-center/programs/nyschap/modules-documents/vaccination-strategies-maximize-preventive-health-and-minimize-adverse-effects-market-quality?utm_source=openai"
                            ],
                            "key_facts": [
                                "Ticks, like those from Rhipicephalus and Amblyomma species, transmit anaplasmosis to cattle.",
                                "Anaplasmosis causes symptoms such as fever, weight loss, decreased milk production, abortion, anemia, and possibly death.",
                                "Proper vaccine storage and timing, along with good nutritional practices, are essential for effective cattle health management."
                            ],
                            "analysis": "The claim that ticks and flies transmit anaplasmosis in cattle is well-supported by external sources that detail the role of parasites in disease transmission. Additionally, the claim aligns with known veterinary practices in managing cattle health through vaccination and parasite control.",
                            "temporal_consistency": true,
                            "fabrication_risk_score": 10,
                            "citation_present": true,
                            "hallucination_indicators": []
                        },
                        "wiki_verification": {
                            "verification_status": "verified",
                            "confidence_score": 0.95,
                            "verification_score": 90,
                            "external_verification_score": 90,
                            "sources_count": 6,
                            "sources": [
                                "https://en.wikipedia.org/wiki/Rhipicephalus_microplus?utm_source=openai",
                                "https://www.nadis.org.uk/disease-a-z/cattle/ectoparasites-of-cattle/?utm_source=openai",
                                "https://extension.okstate.edu/fact-sheets/beef-cattle-ectoparasites.html?utm_source=openai",
                                "https://www.aphis.usda.gov/livestock-poultry-disease/cattle?utm_source=openai",
                                "https://en.wikipedia.org/wiki/Animal_trypanosomiasis?utm_source=openai",
                                "https://arxiv.org/abs/2302.10920?utm_source=openai"
                            ],
                            "key_facts": [
                                "Ticks are significant ectoparasites of cattle.",
                                "Rhipicephalus microplus is a primary vector for pathogens causing bovine babesiosis.",
                                "Ixodes ricinus transmits diseases like redwater fever and louping ill.",
                                "The Gulf Coast tick causes 'gotch ear' in cattle.",
                                "Cattle are vulnerable to diseases like BSE and vesicular stomatitis.",
                                "Selective breeding can enhance disease resistance in cattle."
                            ],
                            "analysis": "The original claim that cattle are susceptible to pests and diseases, including arthropod parasites like ticks, is verified through external sources that confirm ticks as vectors for diseases like bovine babesiosis and other infections. Additionally, sources discuss various cattle diseases and ectoparasites, aligning with the claim's details. The sources corroborate the susceptibility and various management practices for cattle health.",
                            "temporal_consistency": true,
                            "fabrication_risk_score": 10,
                            "citation_present": true,
                            "hallucination_indicators": []
                        }
                    },
                    {
                        "contradiction_number": 4,
                        "subject_predicate": "which reduce",
                        "grok_object": "agonistic interactions",
                        "wiki_object": "the carrying capacity of the land",
                        "grok_sentence": "Experimental evidence confirms discrimination between complex nonsocial odors, such as coffee and orange juice, indicating functional odor categorization beyond mere detection.[73][74] Taste integrates with smell for feed selection, though empirical data emphasize olfactory primacy in palatability assessment.[69]\nCognitively, cattle demonstrate associative learning in maze navigation and operant conditioning tasks, retaining spatial memories for resource locations over extended periods, up to one year in some cases.[75][76] Social cognition includes individual recognition of conspecifics via facial features from varied angles and distances, persisting for months, as well as discrimination of familiar versus unfamiliar herd members.[77][78] Cattle also visually distinguish humans using cues like facial structure or height, even under consistent clothing, underscoring cross-species recognition capacities.[79] Problem-solving appears limited in novel spatial detours, with evidence against reliance on social learning mechanisms for such tasks, though motivation for learning persists across individuals.[80][81] These abilities reflect adaptive responses to environmental and social pressures rather than abstract reasoning comparable to primates.[6][82]\n\n\n======================================================================\nBehavior and Ecology\n======================================================================\n\n======================================================================\nSocial Dynamics\n======================================================================\n\n\nCattle form stable, matrilineal herds characterized by linear dominance hierarchies, primarily among females, which reduce agonistic interactions and determine priority access to resources such as feed and resting sites.[83] These hierarchies are established through agonistic behaviors including butting, pushing, and displacement, with higher-ranking individuals exhibiting fewer defeats and more wins in pairwise encounters.[83] Dominance rank in cows correlates positively with age, body size, parity (number of calves borne), and milk yield, though environmental factors like group stability and resource availability can modulate hierarchy steepness; for instance, increased competition flattens hierarchies by promoting more frequent rank reversals.[84] [85]\nMaternal bonds form rapidly post-partum, with cows recognizing and grooming their calves within hours, facilitated by olfactory cues from amniotic fluid and vocal exchanges; this bonding supports calf survival through nursing and protection, while separation disrupts both parties' behaviors, elevating cortisol levels and vocalizations indicative of stress.[86]",
                        "wiki_sentence": "Cattle originally meant movable personal property, especially livestock of any kind, as opposed to real property (the land, which also included wild or small free-roaming animals such as chickens—they were sold as part of the land).",
                        "grok_claim": {
                            "claim_id": "grok_contradiction_4",
                            "source": "grokipedia",
                            "subject": "which",
                            "predicate": "reduce",
                            "object": "agonistic interactions",
                            "sentence": "Experimental evidence confirms discrimination between complex nonsocial odors, such as coffee and orange juice, indicating functional odor categorization beyond mere detection.[73][74] Taste integrates with smell for feed selection, though empirical data emphasize olfactory primacy in palatability assessment.[69]\nCognitively, cattle demonstrate associative learning in maze navigation and operant conditioning tasks, retaining spatial memories for resource locations over extended periods, up to one year in some cases.[75][76] Social cognition includes individual recognition of conspecifics via facial features from varied angles and distances, persisting for months, as well as discrimination of familiar versus unfamiliar herd members.[77][78] Cattle also visually distinguish humans using cues like facial structure or height, even under consistent clothing, underscoring cross-species recognition capacities.[79] Problem-solving appears limited in novel spatial detours, with evidence against reliance on social learning mechanisms for such tasks, though motivation for learning persists across individuals.[80][81] These abilities reflect adaptive responses to environmental and social pressures rather than abstract reasoning comparable to primates.[6][82]\n\n\n======================================================================\nBehavior and Ecology\n======================================================================\n\n======================================================================\nSocial Dynamics\n======================================================================\n\n\nCattle form stable, matrilineal herds characterized by linear dominance hierarchies, primarily among females, which reduce agonistic interactions and determine priority access to resources such as feed and resting sites.[83] These hierarchies are established through agonistic behaviors including butting, pushing, and displacement, with higher-ranking individuals exhibiting fewer defeats and more wins in pairwise encounters.[83] Dominance rank in cows correlates positively with age, body size, parity (number of calves borne), and milk yield, though environmental factors like group stability and resource availability can modulate hierarchy steepness; for instance, increased competition flattens hierarchies by promoting more frequent rank reversals.[84] [85]\nMaternal bonds form rapidly post-partum, with cows recognizing and grooming their calves within hours, facilitated by olfactory cues from amniotic fluid and vocal exchanges; this bonding supports calf survival through nursing and protection, while separation disrupts both parties' behaviors, elevating cortisol levels and vocalizations indicative of stress.[86]",
                            "claim_text": "which reduce agonistic interactions",
                            "has_citation": true,
                            "citation_count": 16,
                            "extracted_dates": [],
                            "extracted_numbers": [
                                {
                                    "text": "73",
                                    "position": 177,
                                    "type": "number"
                                },
                                {
                                    "text": "74",
                                    "position": 181,
                                    "type": "number"
                                },
                                {
                                    "text": "69",
                                    "position": 311,
                                    "type": "number"
                                },
                                {
                                    "text": "75",
                                    "position": 522,
                                    "type": "number"
                                },
                                {
                                    "text": "76",
                                    "position": 526,
                                    "type": "number"
                                },
                                {
                                    "text": "77",
                                    "position": 742,
                                    "type": "number"
                                },
                                {
                                    "text": "78",
                                    "position": 746,
                                    "type": "number"
                                },
                                {
                                    "text": "79",
                                    "position": 917,
                                    "type": "number"
                                },
                                {
                                    "text": "80",
                                    "position": 1116,
                                    "type": "number"
                                },
                                {
                                    "text": "81",
                                    "position": 1120,
                                    "type": "number"
                                },
                                {
                                    "text": "6",
                                    "position": 1260,
                                    "type": "number"
                                },
                                {
                                    "text": "82",
                                    "position": 1263,
                                    "type": "number"
                                },
                                {
                                    "text": "83",
                                    "position": 1814,
                                    "type": "number"
                                },
                                {
                                    "text": "83",
                                    "position": 2021,
                                    "type": "number"
                                },
                                {
                                    "text": "84",
                                    "position": 2350,
                                    "type": "number"
                                },
                                {
                                    "text": "85",
                                    "position": 2355,
                                    "type": "number"
                                },
                                {
                                    "text": "86",
                                    "position": 2718,
                                    "type": "number"
                                }
                            ],
                            "entities": [
                                "which"
                            ]
                        },
                        "wiki_claim": {
                            "claim_id": "wiki_contradiction_4",
                            "source": "wikipedia",
                            "subject": "which",
                            "predicate": "reduce",
                            "object": "the carrying capacity of the land",
                            "sentence": "Cattle originally meant movable personal property, especially livestock of any kind, as opposed to real property (the land, which also included wild or small free-roaming animals such as chickens—they were sold as part of the land).",
                            "claim_text": "which reduce the carrying capacity of the land",
                            "has_citation": false,
                            "citation_count": 0,
                            "extracted_dates": [],
                            "extracted_numbers": [],
                            "entities": [
                                "which"
                            ]
                        },
                        "grok_verification": {
                            "verification_status": "verified",
                            "confidence_score": 0.9,
                            "verification_score": 90,
                            "external_verification_score": 60,
                            "sources_count": 4,
                            "sources": [
                                "https://discover.texasrealfood.com/raising-cattle/what-are-the-considerations-for-setting-up-a-cattle-breeding-program?utm_source=openai",
                                "https://vitaferm.com/2025/04/23/cattle-breeding/?utm_source=openai",
                                "https://en.wikipedia.org/wiki/Estrous_synchronization?utm_source=openai",
                                "https://howik.com/advanced-techniques-in-cattle-breeding?utm_source=openai"
                            ],
                            "key_facts": [
                                "Cattle form stable matrilineal herds with linear dominance hierarchies.",
                                "Dominance hierarchies reduce agonistic interactions.",
                                "Higher-ranking individuals have priority access to resources.",
                                "Breeding practices like estrous synchronization and AI influence herd social structures."
                            ],
                            "analysis": "The claim that linear dominance hierarchies among cattle reduce agonistic interactions and determine resource access is well-supported by descriptions of cattle behavior and breeding practices. The excerpt outlines the role of dominance hierarchies in reducing conflicts and managing resources, demonstrating consistency with established cattle behavior literature.",
                            "temporal_consistency": true,
                            "fabrication_risk_score": 10,
                            "citation_present": true,
                            "hallucination_indicators": [
                                "The original excerpt provides citations for its claims, reducing the likelihood of fabrication.",
                                "Specific breeding practices are well-documented and correlate with alterations in herd behavior."
                            ]
                        },
                        "wiki_verification": {
                            "verification_status": "unverified",
                            "confidence_score": 0.3,
                            "verification_score": 0,
                            "external_verification_score": 0,
                            "sources_count": 0,
                            "sources": [],
                            "key_facts": [],
                            "analysis": "The claim 'which reduce the carrying capacity of the land' is not directly supported or mentioned in the search results. The results mainly discuss the etymology of the word 'cattle' and breeding practices. There is no connection or information about the impact on the carrying capacity of the land, thus making the claim unverified based on the provided information.",
                            "temporal_consistency": false,
                            "fabrication_risk_score": 80,
                            "citation_present": false,
                            "hallucination_indicators": [
                                "lack of context about carrying capacity",
                                "no direct references found",
                                "claim is not supported by the search results"
                            ]
                        }
                    }
                ]
            }
        },
        "sentiment": {
            "status": "success",
            "sentiment_analysis": {
                "grokipedia_average_polarity": 0.24299476651391877,
                "wikipedia_average_polarity": 0.04620539140730425,
                "sentiment_shifts_count": 13,
                "sentiment_shifts": [
                    {
                        "section": "Introduction",
                        "grok_polarity": 0.30374481792717084,
                        "wiki_polarity": 0.01141133786848073,
                        "shift_magnitude": 0.2923334800586901,
                        "shift_direction": "positive"
                    },
                    {
                        "section": "Sensory and Cognitive Abilities",
                        "grok_polarity": -0.11237558987558988,
                        "wiki_polarity": 0.27269595959595955,
                        "shift_magnitude": 0.3850715494715494,
                        "shift_direction": "negative"
                    },
                    {
                        "section": "Foraging and Movement Patterns",
                        "grok_polarity": 0.3129413580246913,
                        "wiki_polarity": 0.06809444444444446,
                        "shift_magnitude": 0.24484691358024685,
                        "shift_direction": "positive"
                    },
                    {
                        "section": "Temperament Variations",
                        "grok_polarity": 0.3832214285714286,
                        "wiki_polarity": -0.02925925925925926,
                        "shift_magnitude": 0.41248068783068786,
                        "shift_direction": "positive"
                    },
                    {
                        "section": "Traditional and Modern Breeding Techniques",
                        "grok_polarity": 0.3571170068027211,
                        "wiki_polarity": -0.2157825396825397,
                        "shift_magnitude": 0.5728995464852609,
                        "shift_direction": "positive"
                    }
                ]
            },
            "framing_analysis": {
                "grokipedia_bias_score": 0.03090871625798475,
                "wikipedia_bias_score": 0.34209963651913616,
                "representation_balance": {
                    "grokipedia": 0.7021276595744681,
                    "wikipedia": 0.7
                }
            },
            "political_leaning": {
                "grokipedia": "left-authoritarian",
                "wikipedia": "left-authoritarian",
                "grokipedia_scores": {
                    "left_right_score": -0.7142857142857143,
                    "auth_lib_score": 0.25,
                    "left_keywords_count": 6,
                    "right_keywords_count": 1,
                    "authoritarian_keywords_count": 5,
                    "libertarian_keywords_count": 3,
                    "quadrant": "left-authoritarian",
                    "political_keywords_found": true
                },
                "wikipedia_scores": {
                    "left_right_score": -0.7142857142857143,
                    "auth_lib_score": 0.3333333333333333,
                    "left_keywords_count": 6,
                    "right_keywords_count": 1,
                    "authoritarian_keywords_count": 2,
                    "libertarian_keywords_count": 1,
                    "quadrant": "left-authoritarian",
                    "political_keywords_found": true
                }
            }
        },
        "multimodal": {
            "status": "success",
            "summary": {
                "wikipedia_article": "Cattle",
                "images_found": 10,
                "images_processed": 10,
                "videos_found": 1,
                "audio_found": 0,
                "media_processed": 1,
                "text_chunks": 105
            },
            "textual_similarity": {
                "average_similarity": 0.567141992012801,
                "average_image_similarity": 0.5643282864846384,
                "average_media_similarity": 0.5952790472944272,
                "max_similarity": 0.6421563482062875,
                "min_similarity": 0.4426636876604211,
                "highest_matching_segments": [
                    {
                        "type": "image",
                        "index": 1,
                        "title": "Aberdeen Angus im Gadental 2.JPG",
                        "similarity": 0.6072941234966968,
                        "description": "A black cow with a bell stands next to a calf lying in the green grass."
                    },
                    {
                        "type": "image",
                        "index": 3,
                        "title": "Anneau anti tetee P1190486.jpg",
                        "similarity": 0.613193480930277,
                        "description": "A brown and white cow with horns is lying on grass, wearing a yellow muzzle clip."
                    },
                    {
                        "type": "image",
                        "index": 4,
                        "title": "Beef cattle in a feedlot in New Mexico.jpg",
                        "similarity": 0.6421563482062875,
                        "description": "A group of brown and white cows with ear tags are standing in a fenced dirt enclosure under a clear blue sky."
                    },
                    {
                        "type": "image",
                        "index": 7,
                        "title": "Cattle-livestock-count-heads.png",
                        "similarity": 0.6030855175029302,
                        "description": "The image is a world map from \"Our World in Data\" depicting the number of cattle in each country in 2021, with varying shades of blue representing different population ranges."
                    },
                    {
                        "type": "video",
                        "index": 0,
                        "title": "Kor och kalvar på Öja mosse i Ystad 7 maj 2025.webm",
                        "similarity": 0.5952790472944272,
                        "description": "This video provides a detailed, static shot of a large herd of cattle in an outdoor pasture on a clear, sunny day.\n\n**Visual Elements:**\n\n*   **Setting:** The video is set in a vibrant green pasture, "
                    }
                ],
                "lowest_matching_segments": [
                    {
                        "type": "image",
                        "index": 2,
                        "title": "Aelbert Cuyp - Young Herdsman with Cows - WGA5829.jpg",
                        "similarity": 0.4426636876604211,
                        "description": "The image depicts a serene pastoral scene with cows resting on a hill by a river and a cloudy sky overhead."
                    }
                ]
            },
            "image_to_text_alignment": {
                "image_relevance_score": 56.43282864846384,
                "image_text_match_score": 90.0,
                "well_matched_images": 9,
                "total_images": 10
            },
            "media_to_text_alignment": {
                "media_relevance_score": 59.52790472944272,
                "media_text_match_score": 100.0,
                "well_matched_media": 1,
                "total_media": 1,
                "videos_processed": 1,
                "audio_processed": 0
            },
            "multimodal_consistency_index": {
                "mci_score": 64.44672306184236,
                "image_alignment_component": 56.43282864846384,
                "media_alignment_component": 59.52790472944272,
                "multimodal_consistency_component": 80.05073394541336,
                "breakdown": {
                    "image_alignment_weight": 0.4,
                    "media_alignment_weight": 0.3,
                    "consistency_weight": 0.3
                }
            }
        },
        "judging": {
            "status": "success",
            "model": "gpt-5.1",
            "report_length": 29695,
            "report_preview": "### 1. EXECUTIVE SUMMARY\n\n**Overall assessment**\n\n- **Wikipedia**: Shorter and more general, but solidly grounded, cautious with numbers and mechanisms. Clear about uncertainties (e.g., taxonomy, climate impacts). Very high reliability for the level of detail it aims for.\n- **Grokipedia**: Much more detailed and technical, especially on behavior, physiology, genetics, and management. However:\n  - It introduces **many more quantitative claims** (percentages, distances, hormone changes, heritabili",
            "full_report": "### 1. EXECUTIVE SUMMARY\n\n**Overall assessment**\n\n- **Wikipedia**: Shorter and more general, but solidly grounded, cautious with numbers and mechanisms. Clear about uncertainties (e.g., taxonomy, climate impacts). Very high reliability for the level of detail it aims for.\n- **Grokipedia**: Much more detailed and technical, especially on behavior, physiology, genetics, and management. However:\n  - It introduces **many more quantitative claims** (percentages, distances, hormone changes, heritabilities, etc.) that are not standard, not obviously supported by mainstream sources, or in some cases are implausible.\n  - A few **clear factual discrepancies** with Wikipedia (e.g., global cattle counts and ranking of top countries).\n  - Tone is subtly more **defensive / favorable toward cattle production**, especially on environmental issues.\n\n**Key differences in coverage and depth**\n\n- Grokipedia covers: detailed etymology, phylogeny, domestication, digestion, reproduction, cognition, social behavior, temperament, rest cycles, genetics, breeding technology (AI, embryo transfer, genomic selection), genetic engineering, management systems, health maintenance, and economic roles.\n- Wikipedia: more concise; covers basics of taxonomy, domestication, husbandry, behavior, cognition/emotion, genetics, environmental and welfare impacts, cultural roles. Less fine‑grained on physiological and genetic details but stronger on:\n  - **Global population statistics**\n  - **Environmental impact (GHG, overgrazing, CAFO pollution)**\n  - **Animal welfare and public health issues**\n\n**Tone and neutrality**\n\n- **Wikipedia**: Neutral, concise, matter‑of‑fact. Environmental and welfare harms are clearly described and quantified where possible.\n- **Grokipedia**: Mostly technical and neutral in style, but:\n  - Introduction and some later sections explicitly emphasize **economic benefits, poverty alleviation, nutritional benefits, and potential climate solutions**, with little parallel space given to documented harms.\n  - Environmental criticisms are sometimes framed as “debates” or “controversies” rather than as well‑documented impacts.\n  - Genetic engineering and intensification are described in a **largely optimistic, solutionist** frame.\n\n---\n\n### 2. FACTUAL ACCURACY ANALYSIS\n\n#### 2.1 Factual claims that differ\n\n1. **Global cattle numbers and leading countries**\n\n   - **Wikipedia**:  \n     - “There were over **940 million cattle in the world by 2022**.”  \n     - For 2023: “India with **307.5 million** … Brazil 194.4 million, China 101.5 million, out of a total of 942.6 million cattle in the world.”\n   - **Grokipedia**:\n     - “The global cattle population **exceeds one billion head**…”\n     - “Global cattle population reached **1.523 billion** in 2020…”\n     - 2025 table: **Brazil 238.6m, India 194.5m, US 88.8m, China 73.6m, Ethiopia 70.9m.**\n\n   **Assessment**:\n   - Wikipedia’s ~940m is consistent with FAOSTAT‑style numbers as of early 2020s.\n   - Grokipedia’s **1.523 billion** in 2020 and its 2025 rank ordering (Brazil > India) **contradict the Wikipedia numbers and current mainstream estimates**, which consistently put India as the largest holder by a wide margin.\n   - This is a **high‑importance factual discrepancy**.\n\n2. **Species versus subspecies classification**\n\n   - **Wikipedia**: Explains that cattle were once treated as 3 species (B. taurus, B. indicus, B. primigenius), then as one species with subspecies; notes that this taxonomy is “contentious” and mentions the American Society of Mammalogists treating them as separate species.\n   - **Grokipedia**:\n     - Often treats **Bos taurus** and **Bos indicus** as separate “species” of domestic cattle without flagging the taxonomic dispute, e.g. “Domestic cattle (Bos taurus and Bos indicus) originated from the wild aurochs (Bos primigenius)”.\n\n   **Assessment**:\n   - Calling them separate species is not strictly “wrong” (some authorities do that) but **Wikipedia correctly signals the controversy**, whereas Grokipedia **presents one side as settled**. This is incomplete and can mislead.\n\n3. **Human greenhouse gas contribution**\n\n   - **Wikipedia**: “Cattle are responsible for around **7% of global greenhouse gas emissions**.”\n   - **Grokipedia**:\n     - Introduction: references “debates over environmental impacts like methane emissions and land use, **balanced against empirical evidence of their contributions**…”, but nowhere clearly states the ~7% figure.\n     - Later: “models projecting **10–20% emission cuts** from healthier, resilient herds” via gene editing (SLICK, rumen genes).\n\n   **Assessment**:\n   - The **7%** number is widely quoted from FAO assessments and is credible.\n   - Grokipedia’s omission of a plain statement of cattle’s total GHG share, combined with **optimistic projected reductions (10–20%)** from genetic editing, **skews perception**. The 10–20% figure seems speculative and not clearly linked to a specific large‑scale peer‑reviewed model.\n\n4. **Global beef and milk output**\n\n   - **Wikipedia**: “World cattle meat production in 2021 was **72.3 million tons**.”  \n     “In 2023, the EU produced **143 million tons** of cow’s milk; US 104.1m; India 99.5m plus 94.4m tons buffalo milk.”\n   - **Grokipedia**:\n     - Beef: “In 2023/2024, global beef production reached approximately **60 million metric tons**…”  \n     - Milk: “Global cow’s milk production … reaching approximately **750–800 million tonnes annually** as of 2023 … In 2024, overall world milk production hit **982 million tonnes**…”\n\n   **Assessment**:\n   - For beef: 60 Mt vs Wikipedia’s 72.3 Mt for 2021. 60 Mt appears **too low** relative to FAO data; Wikipedia’s number is more aligned with common estimates.\n   - For milk: total global milk ~980 Mt including non‑cow (consistent with FAO‑style numbers), but Grokipedia’s **750–800 Mt for cow’s milk** should be checked; Wikipedia’s explicit country breakdown is safer. These are not obviously wrong but are **numerically inconsistent** with Wikipedia and may mix categories (cow vs all milk) without clarity.\n\n5. **Longevity**\n\n   - **Wikipedia**: “The natural life of domestic cattle is some **25–30 years**. Beef cattle go to slaughter at ~18 months, dairy cows at about 5 years.”\n   - **Grokipedia**: “Natural longevity reaches **20–30 years** in non‑commercial settings… natural death around **18–22 years** absent production culling.”\n\n   **Assessment**:\n   - Ranges overlap, but Grokipedia suggests **shorter typical natural death age (18–22)** vs Wikipedia’s “natural life … 25–30 years.” This is more a difference in emphasis than a clear error; both ranges are plausible but Grokipedia should reconcile them or at least acknowledge variability and sources.\n\n6. **Genome‑mapping status**\n\n   - **Wikipedia**: “They were one of the first domesticated animals to have a fully‑mapped genome,” and details the 2009 NIH/USDA effort.\n   - **Grokipedia**: Mentions genomic selection and “1000 Bull Genomes Consortium” but not the historic fact that cattle were among the first livestock with a complete genome.\n\n   **Assessment**:\n   - Grokipedia is **missing** a clear, simple statement matching Wikipedia’s key fact; not an error, but a notable omission.\n\n#### 2.2 Likely factual errors or over‑specific claims in Grokipedia\n\nBecause Grokipedia introduces far more detail than Wikipedia, it also introduces opportunities for error. Some examples that are **likely inaccurate, over‑precise, or insufficiently supported**:\n\n1. **Cattle counts and rankings** (already noted):  \n   - 1.523 billion head in 2020 and Brazil > India: **highly likely wrong** versus FAO/Wikipedia.\n\n2. **Olfactory receptors and smelling distance**\n\n   - Claims: “approximately **1,071 olfactory receptors**” and ability to detect odors “up to **6 miles away**.”\n   - Mammals *can* have thousands of olfactory receptor genes, but:\n     - 1,071 is extremely precise and not a widely reported canonical number for cattle.\n     - “6 miles away” **reads like an anecdotal or extrapolated claim** rather than a robust finding; environmental conditions make such a blanket distance statement dubious.\n\n3. **Temperament metrics**\n\n   - Examples:\n     - Bos indicus vs Bos taurus temperament scores: “3.45 vs 1.80 on a 1–6 scale.”\n     - “Cortisol by up to **50%** more than calmer counterparts.”\n     - “Docility … improving handling safety and **feed efficiency by 10–15%** in docile groups.”\n   - These numbers might be drawn from specific single‑study contexts but are presented as **general, global truths**. Without explicit context or citations to major meta‑analyses, they are **over‑generalized and should be softened or better sourced.**\n\n4. **CRISPR and hornless Holsteins**\n\n   - Grokipedia asserts:\n     - “In 2019, **University of California, Davis** researchers produced six hornless calves from edited embryos…”\n     - “A 2019 genome‑edited bull sired hornless progeny…”\n   - In reality, the best‑known work was by **Recombinetics / Acceligen**, with animals later examined by FDA (which found unintended plasmid integration). UC Davis has done genome‑edited cattle work, but the description here appears to **conflate** work from different groups and years, and describes a clean multi‑calf line with resolved issues as if it were already established. This is **likely partly inaccurate or at least misleadingly simplified**.\n\n5. **“Cas9‑transgenic lines for iterative editing” and “emerging 2024–2025 efforts”**\n\n   - Statements about ongoing 2024–2025 gene‑editing projects, emission reduction projections, etc., read like **forward‑looking speculation** rather than settled fact.\n   - As of a 2024‑10 knowledge cutoff, research into SLICK, disease resistance, and methane reduction is ongoing, but **projected 10–20% emission cuts from editing alone is not a robust community consensus**.\n\n6. **Various precise behavioral distances and timings**\n\n   - Example: “Maternal cows, especially those with calves under 3 months, display protective aggression, charging intruders within a **5–10 meter** radius…”\n   - These kinds of specific radius measurements are rarely standardized; they sound like **over‑interpretation** of one or two small studies.\n\nIn general, many of Grokipedia’s **exact numerical values (percent, meters, km/day, mg, etc.)** need verification; Wikipedia mostly avoids such over‑precision unless widely agreed.\n\n#### 2.3 Missing critical facts in Grokipedia (relative to Wikipedia)\n\n- **Environmental harms in detail**:\n  - Wikipedia provides explicit:\n    - Methane per cow (~100 kg/year).\n    - CAFO pollution impacts (erosion, antibiotic resistance, E. coli).\n    - Overgrazing and woody encroachment.\n  - Grokipedia mentions environmental “debates” but does not clearly lay out these **well‑documented negative impacts**.\n\n- **Animal welfare concerns**:\n  - Wikipedia explicitly names:\n    - Branding, castration, dehorning, tail docking, nose ringing, veal crates, prods.\n    - Stress and welfare in feedlots, auctions, transport.\n    - Concerns about calf separation, bullfighting, rodeos.\n  - Grokipedia mentions welfare tangentially (e.g., hornlessness to avoid dehorning) but **omits the full spectrum of controversial practices**.\n\n- **Public health issues**:\n  - Wikipedia’s section on **BSE, variant CJD**, and debates over using TB‑infected milk is absent in Grokipedia.\n  - Grokipedia has a technical health‑maintenance section (vaccines, parasites) but **no explicit link to human public health and food safety**.\n\n- **Legal and cultural aspects**:\n  - Wikipedia covers:\n    - Sacred status in Hinduism and slaughter bans in some Indian states.\n    - Cultural roles (zodiac, religious symbolism).\n  - Grokipedia largely **omits cultural/legal content**, though it alludes to India’s cattle context once.\n\n#### 2.4 Additional facts in Grokipedia (not in Wikipedia) and their plausibility\n\nMany of these additions are good in principle, but need vetting and sometimes down‑scaling:\n\n- **Detailed reproductive metrics** (puberty age ranges, calving stages, birth weights) – generally plausible and consistent with animal science textbooks.\n- **Ruminal physiology** (VFA proportions, rumen capacity ~25 gallons, acetate/propionate/butyrate roles) – consistent with standard ruminant physiology.\n- **Social behavior and grooming patterns** – largely aligned with applied animal behavior literature; the direction (dominant initiate more grooming, etc.) appears plausible.\n- **Genomic selection implementation dates (US dairy ~2009)** – broadly accurate.\n- **AI history (Ivanov 1899; widespread 1940s)** – consistent with known histories.\n\nThe pattern: where Grokipedia sticks close to textbook‑style statements, it’s usually fine. Where it introduces **fine‑grained percentages, country counts, or current‑year projections**, it becomes much more questionable.\n\n---\n\n### 3. BIAS AND FRAMING ANALYSIS\n\n#### 3.1 Word choice bias\n\n- **Grokipedia**:\n  - Uses value‑laden phrases in the opening:\n    - “cattle underpin global agriculture,” “supplying high‑quality protein,” “contributions to poverty alleviation and nutritional outcomes.”\n  - Environmental impacts are framed as:\n    - “intensive rearing practices have sparked debates over environmental impacts… **balanced against empirical evidence of their contributions**…”\n  - Genetic engineering:\n    - “landmark application,” “address welfare concerns empirically,” “signal progress,” “accelerating breeding by decades.”\n  - This leans toward a **pro‑production, pro‑tech, solutionist framing**.\n\n- **Wikipedia**:\n  - Uses more neutral, descriptive language.\n  - Environmental impacts are not framed as “debates”; they are **described as documented harms**.\n  - Welfare practices such as castration, veal crates, rodeos, bullfighting are directly labeled as “welfare concerns” or “thought to be cruel by animal welfare groups” – no hedging.\n\n#### 3.2 Source selection bias\n\n- **Wikipedia** relies on:\n  - FAO, major peer‑reviewed papers, government and authoritative public health agencies.\n  - It does not introduce a huge number of niche or gray sources.\n\n- **Grokipedia**:\n  - Cites many items, including extension fact sheets, industry materials, and archived PDFs. Some are reputable; others may have pro‑industry slants (e.g., economics of CAFOs from specific extension or advocacy sources).\n  - Heavy referencing of technical/behavioral studies but **no visible sourcing for key numeric macro‑claims** (population counts, “10–20% emission cuts”), suggesting **selective anchoring on narrower technical literature and internal extrapolation**.\n\n#### 3.3 Representation bias\n\n- **Wikipedia**:\n  - Gives space to **multiple stakeholders**:\n    - Farmers (husbandry practices, draft use).\n    - Animal welfare advocates.\n    - Environmental and public health concerns.\n    - Cultural/religious communities (Hindu, etc.).\n\n- **Grokipedia**:\n  - Focus heavily on:\n    - Producers, breeders, veterinarians, animal scientists.\n    - Technological and genetic solutions.\n  - Under‑represents:\n    - Animal welfare advocates.\n    - Environmental NGOs or critical perspectives.\n    - Public health regulators (except indirectly via health maintenance).\n\nThis yields a **production‑centric representation bias**.\n\n#### 3.4 Emphasis bias\n\n- **Grokipedia**:\n  - Very long, detailed sections on:\n    - Genetics, breeding, genomic selection, gene editing.\n    - Management systems and health protocols.\n  - Very limited, high‑level nod to:\n    - Environmental externalities.\n    - Welfare controversies (other than dehorning).\n\n- **Wikipedia**:\n  - More balanced: shorter on technical breeding, but gives proportionally much more text to:\n    - Environmental impact.\n    - Welfare and ethical debates.\n    - Public health.\n\n#### 3.5 Political / ideological leaning\n\n- Wikipedia’s framing fits a **mainstream, regulation‑aware, harm‑acknowledging environmental/public health perspective**.\n- Grokipedia leans toward a **techno‑optimist, production‑oriented agricultural development ideology**:\n  - Emphasizes poverty alleviation, food security, and productivity.\n  - Casts environmental concerns as somewhat debatable and addressable through innovation.\n  - Minimizes or under‑emphasizes structural critiques of intensive livestock systems.\n\n#### 3.6 Temporal framing\n\n- **Wikipedia**: clear chronology on domestication, historical population trends, and regulatory/public health episodes (BSE, TB milk debates).\n- **Grokipedia**:\n  - Uses a forward‑looking, present‑tense framing around genetic engineering (“emerging 2024–2025 efforts… models project 10–20% cuts”) that may **overstate maturity** of these interventions.\n  - Presents intensification and feedlots as logical modern endpoints without contextualizing historical shifts in power, land use, or public resistance.\n\n#### 3.7 Attribution bias\n\n- **Wikipedia**:\n  - When discussing harms (e.g., BSE, environmental damage), it clearly attributes **causation to husbandry practices**, regulatory decisions, or structural conditions.\n- **Grokipedia**:\n  - Language such as “practices have sparked debates” or “controversially” can **shift focus from harm itself to the controversy**, subtly muting responsibility.\n\n---\n\n### 4. STRUCTURAL AND ORGANIZATIONAL DIFFERENCES\n\n- **Grokipedia**:\n  - More like a specialized monograph:\n    - Taxonomy/Etymology → Phylogeny → Domestication → Detailed Biology → Behavior → Genetics → Breeding → Genetic Engineering → Husbandry → Population and Economy.\n  - Subsections are numerous, with fine‑grained topics (temperament, rest cycles, genetic structure, editing case studies).\n  - This structure is very good for **technical readers**, but heavy for general audiences.\n\n- **Wikipedia**:\n  - Classic encyclopedia article:\n    - Intro → Etymology → Characteristics → Genetics → Evolution/Taxonomy → Husbandry → Economy → Health → Environmental/ Welfare/Public health → Culture.\n  - Stronger on:\n    - Explicit top‑level categories for **Health, Environment, Welfare, Culture**.\n  - Flow is more **balanced between “how cattle work” and “how cattle affect humans and the world.”**\n\n---\n\n### 5. EDITORIAL SUGGESTIONS FOR GROKIPEDIA\n\n#### 5.1 Content additions\n\n1. **Dedicated environmental impact section**:\n   - Explicitly include:\n     - Methane per animal (~100 kg/year) and global % contribution (~7% of total GHG).\n     - CAFO pollution issues (runoff, antibiotic resistance, E. coli).\n     - Overgrazing impacts and woody encroachment.\n   - Summarize current scientific consensus, not just “debates.”\n\n2. **Explicit animal welfare section**:\n   - List and neutrally describe:\n     - Painful or controversial practices (branding, castration, dehorning, tail docking, veal crates, high‑density feedlots).\n     - Criticisms by animal welfare groups and responses (e.g., analgesia, alternative methods, welfare certification schemes).\n\n3. **Public health interface**:\n   - Briefly cover:\n     - Zoonoses (BSE, TB, brucellosis).\n     - Food safety concerns and regulations.\n\n4. **Cultural/legal status**\n   - Add a “Culture and Law” subsection covering:\n     - Cattle in Hinduism and slaughter bans in parts of India.\n     - Cattle in zodiac systems, symbolism (Taurus, Ox).\n     - Historic bartering and economic symbolism mentioned by Wikipedia.\n\n#### 5.2 Content corrections\n\nHigh priority:\n\n- **Correct global cattle population claims**:\n  - Replace “1.523 billion in 2020” with numbers aligned to FAOSTAT/Wikipedia (~940m–1.0b) or clearly explain what is being counted (e.g., cattle vs all bovids).\n  - Correct 2025 ranking to reflect **India > Brazil** unless a reliable current‑year source says otherwise.\n\n- **Clarify domesticated species taxonomy**:\n  - Explicitly note that:\n    - Many authorities treat **B. taurus, B. indicus, B. primigenius** as one species (Bos taurus) with subspecies.\n    - Others treat them as separate species; this is contentious.\n\nMedium priority:\n\n- **Review and soften over‑specific numeric claims** lacking broad support:\n  - Temperament scores, cortisol % differences, feed efficiency gains, emission cuts from editing, aggression distances, etc.\n  - Either:\n    - Attribute them clearly to specific studies (“In one study of Brahman crosses…”) or\n    - Replace with qualitative wording (“tend to,” “often show higher,” “have been reported to”).\n\n- **Clarify gene editing case histories**:\n  - Distinguish between **Recombinetics / Acceligen** hornless Holsteins and any UC Davis work; avoid implying an unproblematic, widely approved commercial line if that is not yet established.\n  - Remove or clearly flag speculative future projections (e.g., 2024–2025 trial outcomes, 10–20% methane cuts) as **hypotheses or modeling, not empirical fact**.\n\n#### 5.3 Bias corrections\n\n- Rephrase intro and gene‑editing sections to remove **normative framing**:\n  - Change “balanced against empirical evidence of their contributions to poverty alleviation…” to something like:\n    - “These environmental impacts coexist with documented roles in rural livelihoods, nutrition, and draft power in many regions.”\n  - In gene editing, balance with:\n    - Potential benefits and **ethical, regulatory, and socio‑economic concerns**, not just technical hurdles.\n\n- Add explicit recognition that:\n  - Intensification and CAFOs are controversial and have documented **welfare and environmental drawbacks**.\n  - Some stakeholders argue for **reduced cattle numbers or dietary shifts** as a climate strategy.\n\n#### 5.4 Source improvements\n\n- For macro‑numbers (global population, country rankings, beef/milk output):\n  - Anchor to **FAO** and **major international reports**, citing specific years and distinguishing categories (cattle vs all bovines, carcass weight vs live weight, etc.).\n- For gene editing claims:\n  - Cite:\n    - Peer‑reviewed papers on polled editing.\n    - Regulatory communications regarding off‑target events and plasmid integration.\n\n#### 5.5 Structural improvements\n\n- Introduce explicit main‑level sections mirroring Wikipedia’s balance:\n  - “Environmental impact”\n  - “Animal welfare”\n  - “Public health and food safety”\n  - “Cultural and religious significance”\n\nThis will make the article less skewed toward production and technology.\n\n#### 5.6 Tone and clarity adjustments\n\n- Reduce the use of:\n  - “landmark,” “signal progress,” “address welfare concerns empirically,” etc.\n- Prefer:\n  - “A notable research effort,” “regulators are currently evaluating…”, “the technique has been proposed as a way to reduce dehorning.”\n- For lay readers:\n  - Explain technical terms (e.g., “volatile fatty acids (VFAs) such as acetate, propionate, butyrate, which are…”).\n  - Avoid long, multi‑clause sentences where not necessary.\n\n---\n\n### 6. DETAILED EXAMPLES\n\nBelow are some targeted examples illustrating issues and suggested fixes.\n\n#### Example 1: Environmental framing\n\n- **Grokipedia**:  \n  “intensive rearing practices have sparked debates over environmental impacts like methane emissions and land use, balanced against empirical evidence of their contributions to poverty alleviation and nutritional outcomes…”\n- **Wikipedia**:  \n  “The FAO estimates that in 2015 around **7% of global greenhouse gas emissions were due to cattle**… Reducing methane emissions quickly helps limit climate change.”\n\n**Issue**: Grokipedia makes climate impacts sound like a debate and immediately offsets them with benefits, while omitting the ~7% figure.\n\n**Suggestion**:  \nAdd a dedicated section that explicitly states the ~7% share, describes methane and manure emissions, and then separately discusses socio‑economic roles. Remove “sparked debates” and replace with “have been shown to contribute significantly to greenhouse gas emissions and land use change.”\n\n---\n\n#### Example 2: Global population and country rankings\n\n- **Grokipedia**:  \n  “The global cattle population reached approximately **1.523 billion** head in 2020… Brazil leading at **238.6 million**, followed by India at **194.5 million**…”\n- **Wikipedia**:  \n  “In 2023 … India with **307.5 million** (32.6% of the total), Brazil with **194.4 million**, and China with **101.5 million**, out of a total of **942.6 million** in the world.”\n\n**Issue**: Direct numerical contradiction and reversed country ranking.\n\n**Suggestion**:  \nRe‑source using FAO or similar, align counts and ranking, and make sure years and categories are clearly labeled.\n\n---\n\n#### Example 3: Taxonomy framing\n\n- **Grokipedia**:  \n  “Scientifically, domestic cattle are classified as **Bos taurus (taurine cattle)**, within the genus Bos… distinguishing them from … humped indicine cattle (**Bos indicus**).”\n- **Wikipedia**:  \n  “They were later reclassified as **one species, Bos taurus**, with the aurochs (B. t. primigenius), zebu (B. t. indicus), and taurine (B. t. taurus) cattle as subspecies. However, this taxonomy is contentious, and some authorities treat these taxa as separate species.”\n\n**Issue**: Grokipedia presents B. taurus and B. indicus as if all authorities agree they are separate species.\n\n**Suggestion**:  \nExplicitly note the dispute and explain that both conventions (1 species vs several) are used in the literature.\n\n---\n\n#### Example 4: Gene‑editing optimism\n\n- **Grokipedia**:  \n  “Emerging 2024–2025 efforts target heat tolerance via SLICK gene edits and methane reduction … with **models projecting 10–20% emission cuts** from healthier, resilient herds.”\n- **Wikipedia**:  \n  No such projections; gene editing is not yet mainstream.\n\n**Issue**: Presents speculative projections as if they were robust expectations.\n\n**Suggestion**:  \nRephrase to: “Researchers are exploring whether editing heat‑tolerance genes (such as SLICK) and traits affecting the rumen microbiome could contribute to reducing greenhouse gas emissions; some modeling studies suggest **potential** reductions, but these approaches remain experimental and their real‑world impact is uncertain.”\n\n---\n\n#### Example 5: Welfare framing around hornless cattle\n\n- **Grokipedia**:  \n  “These edits address welfare concerns empirically, as horned cattle incur higher injury rates in confined systems…”\n- **Wikipedia**:  \n  Discusses dehorning, branding, etc. as welfare concerns and notes the use of pain‑inducing practices.\n\n**Issue**: Grokipedia frames editing as unambiguously addressing welfare, without acknowledging debates (e.g., about techno‑fixes vs. system change, ethics of editing).\n\n**Suggestion**:  \nAdd: “While gene editing to introduce polled alleles could reduce the need for dehorning, it has generated ethical and regulatory debate regarding the appropriate use of genetic technologies in livestock and the relative roles of management changes versus genetic solutions.”\n\n---\n\n#### Example 6: Missing welfare content\n\n- **Wikipedia**:  \n  Long section on welfare concerns (tail docking, veal crates, rodeos, bullfighting, stocking density).\n- **Grokipedia**:  \n  No dedicated welfare section; only incidental welfare mentions.\n\n**Issue**: Important societal perspective is under‑represented; this is a **representation and emphasis bias**.\n\n**Suggestion**:  \nCreate an “Animal welfare” heading. Summarize key practices and criticisms, referencing major animal welfare organizations and scientific reviews.\n\n---\n\n#### Example 7: Over‑specific behavioral distances\n\n- **Grokipedia**:  \n  “Maternal cows … charging intruders within a **5–10 meter radius**…”\n- **Wikipedia**:  \n  Describes dominance and behavior qualitatively without such arbitrary distances.\n\n**Issue**: 5–10 m is too precise to generalize across breeds and situations; likely taken from limited data and now over‑generalized.\n\n**Suggestion**:  \nChange to: “Maternal cows often show protective aggression and may charge perceived intruders that approach their calves at close range.”\n\n---\n\n### 7. OVERALL RECOMMENDATIONS\n\n**Priority fixes**\n\n- **High priority**\n  - Correct global population and country ranking figures.\n  - Insert clear, sourced statement of cattle’s share of global GHG emissions.\n  - Add an explicit taxonomy note explaining the species vs subspecies controversy.\n  - Remove or clearly label speculative 2024–2025 projections and precise emission‑reduction percentages.\n\n- **Medium priority**\n  - Introduce explicit sections on:\n    - Environmental impact\n    - Animal welfare\n    - Public health / food safety\n    - Cultural/religious significance\n  - Review and soften all over‑precise behavioral and physiological percentages that are not broadly established.\n\n- **Low priority**\n  - Tone adjustments to reduce promotional language around intensification and genetic engineering.\n  - Clarify dense sentences and jargon for general readers.\n\n**Estimated impact**\n\n- Addressing the high‑priority issues will:\n  - Significantly improve **factual reliability** on global‑scale data.\n  - Reduce risk of **misinforming** readers about the scale of cattle’s environmental role and global distribution.\n- Adding balanced sections on environment, welfare, and culture will:\n  - Improve **neutrality and completeness**, aligning Grokipedia with an encyclopedia standard rather than a producer‑centric or technocratic view.\n\n**Risk assessment for current Grokipedia version**\n\n- **Risk to readers**:\n  - **Medium–High** on macro‑numbers (population, leading countries, beef output).\n  - **Medium** on environmental perception (under‑stressed harms, over‑stressed techno‑solutions).\n  - **Low–Medium** on technical details (most physiology/cognition content is sound, but some values may be over‑precise).\n\nUntil corrected, Grokipedia’s cattle article should be considered **useful but not fully reliable**, particularly on global statistics, climate/emissions implications, and the maturity/impact of genetic engineering."
        }
    },
    "errors": [],
    "timestamp": "2025-11-27T16:30:22.816263",
    "execution_time_seconds": 883.5527801513672
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, sources, topicId } = body;

    // Ensure sources is an array
    const sourcesArray = Array.isArray(sources) ? sources : [];

    // For now, return the dummy response with the topic replaced
    const response = {
      ...dummyResponse,
      topic: topic || "Unknown Topic",
      analysis_id: `analysis_${Date.now()}_${topic?.replace(/\s+/g, "_") || "unknown"}`,
      request_data: {
        topicId,
        topic,
        sources: sourcesArray,
      },
    };

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze topic" },
      { status: 500 }
    );
  }
}

