---
title: "Indian Philosophy — Relationships"
topic: "Indian Philosophy: Vedas, Vedanta, Kanada, Shankaracharya"
generated: "2026-03-25"
depth: "beginner"
---

# Indian Philosophy — Relationships

How do all the concepts, texts, and schools connect to each other? This file maps the structural relationships — using entity diagrams and class hierarchies — so you can see Indian philosophy as a system, not just a list of ideas.

---

## Entity Relationship Diagram — Core Concepts

```erDiagram
    BRAHMAN {
        string nature "Pure consciousness, Being, Bliss"
        string description "Ultimate reality, ground of all existence"
        string attributes "Sat-Chit-Ananda"
    }

    ATMAN {
        string nature "Individual self / witness-consciousness"
        string relationship_to_brahman "Identical (Advaita) or part (Vishishtadvaita) or distinct (Dvaita)"
    }

    MAYA {
        string nature "Cosmic power / appearance layer"
        string effect "Creates apparent multiplicity"
        string school_view "Illusion (Advaita) or God's creative power (Ramanuja/Madhva)"
    }

    AVIDYA {
        string nature "Fundamental ignorance / structural misperception"
        string result "Takes Maya-appearance for ultimate reality"
    }

    PRAKRITI {
        string nature "Matter / Nature / the dynamic principle"
        string school "Samkhya and Yoga"
        string evolves_into "25 Tattvas including Mahat, Ahamkara, senses, elements"
    }

    PURUSHA {
        string nature "Pure consciousness / witness self"
        string school "Samkhya"
        string note "Multiple Purushas exist — one per being"
    }

    KARMA {
        string types "Sanchita, Prarabdha, Agami"
        string mechanism "Every ego-driven action creates binding consequence"
    }

    SAMSARA {
        string nature "Cycle of birth, death, rebirth"
        string driver "Unresolved karma"
        string exits_via "Moksha"
    }

    MOKSHA {
        string advaita_def "Realising Atman = Brahman — no more rebirth"
        string vishishtadvaita_def "Eternal bliss in Vishnu's realm with individual identity"
        string dvaita_def "Eternal devotion to Vishnu, permanently distinct"
    }

    UPANISHADS {
        string count "108 total, 12-13 principal"
        string purpose "Philosophical conclusions of the Vedas"
        string key_teaching "Brahman-Atman identity or relation"
    }

    DARSHANAS {
        string count "6 orthodox schools"
        string accept "Vedic authority"
    }

    BODHAM {
        string meaning "Pure awareness / enlightened knowing"
        string relation_to_brahman "Is the Chit (consciousness) aspect of Brahman"
    }

    PRAMANA {
        string types "Pratyaksha, Anumana, Shabda, Upamana, Arthapatti, Anupalabdhi"
        string purpose "Valid means of knowledge"
    }

    BRAHMAN ||--o{ ATMAN : "appears as (Advaita) / pervades (Vishishtadvaita) / creates (Dvaita)"
    BRAHMAN ||--|| BODHAM : "is identical to (Chit aspect)"
    BRAHMAN ||--o{ MAYA : "projects / wields as creative power"
    MAYA ||--o{ AVIDYA : "sustained by and sustaining"
    AVIDYA ||--o{ SAMSARA : "causes and perpetuates"
    SAMSARA ||--o{ KARMA : "driven by"
    KARMA ||--o{ SAMSARA : "generates further"
    ATMAN ||--|| MOKSHA : "attains or realises"
    MOKSHA ||--o{ SAMSARA : "is liberation from"
    PURUSHA ||--o{ PRAKRITI : "witnesses without engaging"
    PRAKRITI ||--o{ SAMSARA : "evolves into the world of"
    UPANISHADS ||--o{ DARSHANAS : "provide textual basis for"
    DARSHANAS ||--o{ PRAMANA : "each defines valid"
    PRAMANA ||--|| BODHAM : "pathway to achieving"
```

---

## Class Hierarchy — Texts, Schools, and Traditions

```classDiagram
    class VedicCorpus {
        +RigVeda
        +SamaVeda
        +YajurVeda
        +AtharvaVeda
        +compose() Samhitas
        +compose() Brahmanas
        +compose() Aranyakas
        +conclude() Upanishads
    }

    class Upanishads {
        +BrihadaranyakaUpanishad
        +ChandogyaUpanishad
        +KathaUpanishad
        +MandukyaUpanishad
        +TaittiriyaUpanishad
        +teaches() BrahmanAtmanIdentity
        +contains() Mahavakyas
    }

    class BrahmaSutras {
        +author: Badarayana
        +date: 400 BCE
        +systematises() UpanishadicTeaching
        +provides() canonForVedanta
    }

    class BhagavadGita {
        +setting: Kurukshetra battlefield
        +teacher: Krishna
        +student: Arjuna
        +chapters: 18
        +synthesises() JnanaYoga
        +synthesises() KarmaYoga
        +synthesises() BhaktiYoga
    }

    class PrasthanaTrayiCanon {
        <<interface>>
        +Upanishads
        +BrahmaSutras
        +BhagavadGita
        +requiresCommentary() Bhashya
    }

    class OrthodoxSchools {
        <<abstract>>
        +acceptVedicAuthority: true
        +hasSutraText: true
        +hasFounder: string
    }

    class Nyaya {
        +founder: Gautama
        +focus: Logic and epistemology
        +pramanas: 4
        +inferenceSteps: 5
    }

    class Vaisheshika {
        +founder: Kanada
        +focus: Atomic ontology
        +padarthas: 7
        +atomTheory: Anu
    }

    class Samkhya {
        +founder: Kapila
        +focus: Dualist cosmology
        +tattvas: 25
        +duality: Purusha_Prakriti
    }

    class Yoga {
        +founder: Patanjali
        +focus: Mind control and liberation
        +limbs: 8
        +goal: Samadhi
    }

    class Mimamsa {
        +founder: Jaimini
        +focus: Vedic ritual and Dharma
        +pramanas: 6
    }

    class Vedanta {
        +founder: Badarayana
        +focus: Ultimate metaphysics
        +primaryText: BrahmaSutras
        +subSchools: 3
    }

    class Advaita {
        +founder: Shankaracharya
        +origin: Kerala
        +date: 788 CE
        +thesis: Brahman_equals_Atman
        +worldStatus: Mithya
        +primaryPath: JnanaYoga
    }

    class Vishishtadvaita {
        +founder: Ramanujacharya
        +origin: TamilNadu
        +date: 1017 CE
        +thesis: Jiva_is_bodyOfGod
        +worldStatus: Real
        +primaryPath: BhaktiYoga
    }

    class Dvaita {
        +founder: Madhvacharya
        +origin: Karnataka
        +date: 1238 CE
        +thesis: God_Jiva_World_allDistinct
        +worldStatus: Real
        +distinctions: PanchaBheda
    }

    class HeterodoxSchools {
        <<abstract>>
        +rejectVedicAuthority: true
    }

    class Buddhism {
        +founder: SiddharthaGautama
        +coreTeaching: FourNobleTruths
        +selfDoctrine: Anatta
        +goal: Nirvana
    }

    class Jainism {
        +founder: Mahavira
        +coreTeaching: Anekantavada
        +ethics: Ahimsa
    }

    VedicCorpus --> Upanishads : contains as final layer
    Upanishads --> PrasthanaTrayiCanon : forms part of
    BrahmaSutras --> PrasthanaTrayiCanon : forms part of
    BhagavadGita --> PrasthanaTrayiCanon : forms part of
    PrasthanaTrayiCanon --> Vedanta : interpreted by

    OrthodoxSchools <|-- Nyaya
    OrthodoxSchools <|-- Vaisheshika
    OrthodoxSchools <|-- Samkhya
    OrthodoxSchools <|-- Yoga
    OrthodoxSchools <|-- Mimamsa
    OrthodoxSchools <|-- Vedanta

    Vedanta <|-- Advaita
    Vedanta <|-- Vishishtadvaita
    Vedanta <|-- Dvaita

    HeterodoxSchools <|-- Buddhism
    HeterodoxSchools <|-- Jainism
```

---

## Prose Explanation of Key Relationships

### Brahman and Atman — The Central Relationship

The relationship between **Brahman** (ultimate reality) and **Atman** (individual self) is the hinge point of all Vedanta philosophy. Every other relationship in the tradition flows from how you answer this one. The three answers:

1. **Advaita:** They are *numerically identical* — like asking whether the light in two separate rooms is the "same" light. Yes — it's the same electricity flowing through. The separation is a product of the walls (Maya/Avidya), not a fact about the light.

2. **Vishishtadvaita:** They are *inseparably related* like a body and its soul. The soul doesn't exist apart from the body, but is not *the same as* the body. Jiva (individual soul) is the "body" of God — real, distinct, but inseparable.

3. **Dvaita:** They are *genuinely distinct* — like client and server. They communicate, God acts upon souls (grace), souls approach God (devotion) — but they never merge.

### Vedas → Upanishads → Darshanas — The Textual Chain

The four Vedas are the authoritative root. The Upanishads are their philosophical conclusions (literally, the Vedanta — "end of the Vedas"). The Brahma Sutras systematise the Upanishadic teaching into aphorisms. The Bhagavad Gita is a practical synthesis for the non-renunciant. Together, these three (Upanishads + Brahma Sutras + Gita) form the **Prasthanatrayi** — the "triple canon" that every Vedanta school must interpret.

Every major Vedanta philosopher wrote commentaries (**Bhashya**) on all three. The commentaries are where the philosophical debates live — Shankara, Ramanuja, and Madhva all comment on the same sentences and reach different conclusions. Reading two commentators side-by-side on the same verse is like reading two pull requests that disagree on the correct implementation.

### Maya and Avidya — Power and Ignorance

**Maya** and **Avidya** are often used interchangeably but have a subtle distinction:
- **Maya** is the *cosmic* power — the force that makes Brahman appear as the world of multiplicity. It operates at the level of the universe.
- **Avidya** is the *individual* ignorance — your personal misperception of the world as ultimately real and separate from you.

They are functionally related: Maya creates the stage; Avidya is when you forget you're watching a play and think the villain is really going to hurt you. Both dissolve upon realisation (Jnana).

### Karma and Samsara — The Binding Feedback Loop

Karma and Samsara are in a mutually reinforcing loop — like two processes calling each other without a base case:

```
function samsara() {
    live();          // experience current Prarabdha karma
    generate_agami_karma();  // create new karma through ego-driven action
    die();
    samsara();       // recurse
}
```

The exit condition is Moksha. But how do you exit? By **not generating new Agami karma** (through Karma Yoga — action without ego-attachment), while gradually exhausting existing Prarabdha karma through lived experience, and dissolving Sanchita karma through Jnana (direct knowledge of Brahman), Bhakti (divine grace dissolves accumulated karma), or both.

### Pramanas — The Epistemological Foundation

All the grand metaphysical claims only make sense within an epistemological framework — which is why the **Pramanas** (valid means of knowledge) are foundational. Every school had to agree on what counts as evidence before it could argue about reality.

The fight over Pramanas is like arguing about what testing frameworks are valid before you can claim your code is correct. Advaita Vedanta accepts six Pramanas. Buddhism accepts only two (Pratyaksha + Anumana). Carvaka materialists accept only one (Pratyaksha). The more Pramanas you accept, the more things can be known — including the Vedas (Shabda/testimony) and inference from absence.

---

*See `06_glossary.md` for definitions of every term used in this file.*
