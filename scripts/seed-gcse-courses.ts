import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { courses, chapters, pages, markdownContent } from '../src/db/schema'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set')
}

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

// You'll need to replace this with an actual admin Clerk ID
const ADMIN_CLERK_ID = process.env.SEED_ADMIN_CLERK_ID || 'user_admin_placeholder'

const gcseCoursesData = [
  {
    title: 'GCSE Mathematics - Foundation',
    description: 'Complete GCSE Mathematics Foundation tier course covering number, algebra, geometry, and statistics. Aligned with AQA, Edexcel, and OCR specifications.',
    isPublished: true,
    isFree: false,
    chapters: [
      {
        title: 'Number Operations',
        description: 'Master fundamental number operations including fractions, decimals, and percentages.',
        isPublished: true,
        isFree: true,
        pages: [
          {
            title: 'Introduction to Fractions',
            pageType: 'markdown',
            content: `# Introduction to Fractions

## What is a Fraction?

A fraction represents a part of a whole. It consists of:
- **Numerator** (top number): The number of parts we have
- **Denominator** (bottom number): The total number of equal parts

## Types of Fractions

### Proper Fractions
The numerator is smaller than the denominator.
- Example: 3/4, 1/2, 5/8

### Improper Fractions
The numerator is larger than or equal to the denominator.
- Example: 7/4, 9/5, 11/3

### Mixed Numbers
A whole number combined with a proper fraction.
- Example: 2 1/4, 3 2/5

## Converting Between Forms

### Improper to Mixed Number
Divide the numerator by the denominator:
- 7 ÷ 4 = 1 remainder 3
- So 7/4 = 1 3/4

### Mixed to Improper
Multiply whole number by denominator, then add numerator:
- 2 1/4 = (2 × 4 + 1)/4 = 9/4

## Practice Questions

1. Convert 11/3 to a mixed number
2. Convert 4 2/5 to an improper fraction
3. Identify: Is 5/9 proper or improper?`
          },
          {
            title: 'Adding and Subtracting Fractions',
            pageType: 'markdown',
            content: `# Adding and Subtracting Fractions

## Same Denominators

When fractions have the same denominator, simply add or subtract the numerators.

**Example:** 3/7 + 2/7 = 5/7

## Different Denominators

Find a common denominator first.

### Step-by-step:
1. Find the LCM of the denominators
2. Convert each fraction
3. Add/subtract the numerators

**Example:** 1/4 + 2/3

1. LCM of 4 and 3 = 12
2. 1/4 = 3/12 and 2/3 = 8/12
3. 3/12 + 8/12 = 11/12

## With Mixed Numbers

Convert to improper fractions first, then proceed as above.

**Example:** 2 1/3 - 1 1/2
- = 7/3 - 3/2
- = 14/6 - 9/6
- = 5/6`
          },
          {
            title: 'Multiplying and Dividing Fractions',
            pageType: 'markdown',
            content: `# Multiplying and Dividing Fractions

## Multiplication

Multiply numerators together and denominators together.

**Example:** 2/3 × 4/5 = 8/15

### Simplifying Before Multiplying
Cross-cancel to make calculations easier.

**Example:** 3/4 × 2/9
- Cancel 3 and 9: 1/4 × 2/3 = 2/12 = 1/6

## Division

"Keep, Change, Flip" - Keep the first fraction, change to multiplication, flip the second.

**Example:** 3/4 ÷ 2/5
- = 3/4 × 5/2
- = 15/8
- = 1 7/8

## Practice Problems

1. Calculate: 5/6 × 3/10
2. Calculate: 7/8 ÷ 1/4
3. A recipe needs 2/3 cup of flour. How much for half the recipe?`
          }
        ]
      },
      {
        title: 'Basic Algebra',
        description: 'Introduction to algebraic expressions, equations, and formulae.',
        isPublished: true,
        isFree: false,
        pages: [
          {
            title: 'Algebraic Expressions',
            pageType: 'markdown',
            content: `# Algebraic Expressions

## What is an Algebraic Expression?

An algebraic expression uses letters (variables) to represent numbers.

## Key Vocabulary

- **Variable**: A letter representing an unknown value (e.g., x, y)
- **Coefficient**: The number multiplying a variable (in 3x, coefficient is 3)
- **Constant**: A fixed number (no variable)
- **Term**: Parts separated by + or -

## Simplifying Expressions

### Collecting Like Terms
Only combine terms with the same variable.

**Example:** 3x + 2y + 5x - y
- = (3x + 5x) + (2y - y)
- = 8x + y

### Expanding Brackets
Multiply each term inside by the term outside.

**Example:** 3(2x + 4)
- = 3 × 2x + 3 × 4
- = 6x + 12

## Substitution

Replace variables with given values.

**Example:** Find the value of 2x + 3y when x = 4 and y = -2
- = 2(4) + 3(-2)
- = 8 - 6
- = 2`
          },
          {
            title: 'Solving Linear Equations',
            pageType: 'markdown',
            content: `# Solving Linear Equations

## The Balance Method

Whatever you do to one side, do to the other.

## One-Step Equations

**Example:** x + 5 = 12
- Subtract 5 from both sides
- x = 7

## Two-Step Equations

**Example:** 2x + 3 = 11
1. Subtract 3: 2x = 8
2. Divide by 2: x = 4

## Equations with Variables on Both Sides

**Example:** 3x + 2 = x + 10
1. Subtract x from both sides: 2x + 2 = 10
2. Subtract 2: 2x = 8
3. Divide by 2: x = 4

## Equations with Brackets

**Example:** 2(x + 3) = 14
1. Expand: 2x + 6 = 14
2. Subtract 6: 2x = 8
3. Divide by 2: x = 4

## Checking Your Answer

Always substitute back to verify!
- 2(4 + 3) = 2(7) = 14 ✓`
          }
        ]
      }
    ]
  },
  {
    title: 'GCSE English Literature',
    description: 'Comprehensive English Literature course covering poetry analysis, Shakespeare, and modern texts. Includes exam techniques and essay writing skills.',
    isPublished: true,
    isFree: false,
    chapters: [
      {
        title: 'Poetry Analysis Skills',
        description: 'Learn how to analyze poetry effectively using key literary techniques.',
        isPublished: true,
        isFree: true,
        pages: [
          {
            title: 'Introduction to Poetry Analysis',
            pageType: 'markdown',
            content: `# Introduction to Poetry Analysis

## The SMILE Framework

Use **SMILE** to analyze any poem:

- **S**tructure: Form, stanzas, line length
- **M**eaning: Themes and message
- **I**magery: Visual language and descriptions
- **L**anguage: Word choice, techniques
- **E**ffect: Impact on the reader

## Key Literary Techniques

### Metaphor
A direct comparison without using 'like' or 'as'.
> "Life is a journey"

### Simile
A comparison using 'like' or 'as'.
> "Her eyes sparkled like diamonds"

### Personification
Giving human qualities to non-human things.
> "The wind whispered through the trees"

### Alliteration
Repetition of consonant sounds at the start of words.
> "Peter Piper picked a peck of pickled peppers"

## Structure Analysis

Consider:
- Number of stanzas
- Regular or irregular rhyme scheme
- Enjambment vs end-stopped lines
- Caesura (pauses within lines)`
          },
          {
            title: 'Analyzing War Poetry',
            pageType: 'markdown',
            content: `# Analyzing War Poetry

## Context Matters

Understanding the historical context is crucial for war poetry.

### World War I Poets
- Wilfred Owen - "Dulce et Decorum Est"
- Siegfried Sassoon - "Attack"
- Rupert Brooke - "The Soldier"

## Common Themes

1. **Horror of War**: Graphic imagery, suffering
2. **Loss of Innocence**: Youth destroyed
3. **Futility**: Questioning purpose
4. **Patriotism**: Love of country (sometimes ironic)
5. **Comradeship**: Brotherhood between soldiers

## Example Analysis: "Exposure" by Wilfred Owen

### Structure
- 8 stanzas, each ending with a half-line
- Creates sense of incompleteness/waiting

### Language
- "merciless iced east winds that knive us"
- Personification of weather as enemy
- Sibilance creates harsh, cutting sound

### Key Quote Analysis
> "But nothing happens"

- Refrain emphasizes monotony
- Ironic - soldiers face death but "nothing happens"
- Shows psychological toll of waiting`
          }
        ]
      },
      {
        title: 'Shakespeare: Macbeth',
        description: 'In-depth analysis of Macbeth including themes, characters, and key scenes.',
        isPublished: true,
        isFree: false,
        pages: [
          {
            title: 'Macbeth - Key Themes',
            pageType: 'markdown',
            content: `# Macbeth - Key Themes

## Ambition

### The Destructive Nature of Ambition
- Macbeth's "vaulting ambition" leads to his downfall
- Lady Macbeth's ambition corrupts her femininity

**Key Quote:**
> "I have no spur / To prick the sides of my intent, but only / Vaulting ambition"

## Guilt and Conscience

### Psychological Torment
- Macbeth sees Banquo's ghost
- Lady Macbeth's sleepwalking

**Key Quote:**
> "Will all great Neptune's ocean wash this blood / Clean from my hand?"

## Appearance vs Reality

### Nothing is What it Seems
- "Fair is foul, and foul is fair"
- The witches' deceptive prophecies
- Lady Macbeth's false hospitality

## Supernatural

### The Role of the Witches
- Catalysts for action
- Represent evil and temptation
- Reflect Jacobean beliefs

## Kingship and Tyranny

### Good King vs Tyrant
- Duncan: benevolent, trusting
- Macbeth: paranoid, violent`
          },
          {
            title: 'Key Scenes Analysis',
            pageType: 'markdown',
            content: `# Key Scenes Analysis

## Act 1, Scene 7 - "Is This a Dagger?"

### Context
Macbeth hallucinates a dagger before Duncan's murder.

### Analysis
- Visual representation of guilt
- Questions his own sanity: "or art thou but / A dagger of the mind?"
- Foreshadows the violence to come

### Techniques
- Rhetorical questions show internal conflict
- Imagery of blood anticipates guilt
- Soliloquy reveals true thoughts

## Act 2, Scene 2 - The Murder

### Key Moment
Lady Macbeth's response: "A little water clears us of this deed"

### Dramatic Irony
- She will later obsessively wash her hands
- Cannot clear conscience so easily

## Act 5, Scene 5 - "Tomorrow and Tomorrow"

### Macbeth's Nihilism
> "Life's but a walking shadow, a poor player / That struts and frets his hour upon the stage"

### Analysis
- Theatrical metaphor - life is meaningless performance
- Complete loss of hope and purpose
- Contrast with his earlier ambition`
          }
        ]
      }
    ]
  },
  {
    title: 'GCSE Combined Science - Biology',
    description: 'Complete Biology component for GCSE Combined Science covering cell biology, organisation, infection, and bioenergetics.',
    isPublished: true,
    isFree: true,
    chapters: [
      {
        title: 'Cell Biology',
        description: 'Understanding cell structure, transport, and division.',
        isPublished: true,
        isFree: true,
        pages: [
          {
            title: 'Animal and Plant Cells',
            pageType: 'markdown',
            content: `# Animal and Plant Cells

## Common Cell Structures

Both animal and plant cells contain:

| Structure | Function |
|-----------|----------|
| Nucleus | Contains DNA, controls cell activities |
| Cytoplasm | Where chemical reactions occur |
| Cell membrane | Controls what enters/leaves cell |
| Mitochondria | Site of aerobic respiration |
| Ribosomes | Protein synthesis |

## Plant Cell Only

| Structure | Function |
|-----------|----------|
| Cell wall | Made of cellulose, provides support |
| Chloroplasts | Site of photosynthesis |
| Permanent vacuole | Contains cell sap, maintains turgor |

## Microscopy

### Calculating Magnification
**Magnification = Image size ÷ Actual size**

### Units
- 1 mm = 1000 μm (micrometres)
- 1 μm = 1000 nm (nanometres)

### Example Calculation
A cell has an actual diameter of 50 μm. The image measures 25 mm.
- Convert: 25 mm = 25,000 μm
- Magnification = 25,000 ÷ 50 = ×500`
          },
          {
            title: 'Cell Division - Mitosis',
            pageType: 'markdown',
            content: `# Cell Division - Mitosis

## Why Do Cells Divide?

- **Growth**: Organisms get bigger
- **Repair**: Replace damaged cells
- **Replacement**: Old cells die

## The Cell Cycle

### Interphase (Growth Phase)
- DNA replicates
- Organelles increase
- Cell grows

### Mitosis (Division Phase)

1. **Prophase**: Chromosomes condense, nuclear membrane breaks down
2. **Metaphase**: Chromosomes line up at equator
3. **Anaphase**: Chromatids pulled to opposite poles
4. **Telophase**: Nuclear membranes reform
5. **Cytokinesis**: Cytoplasm divides

## Key Points

- Produces **2 identical daughter cells**
- Same number of chromosomes as parent
- **Diploid** cells (full set of chromosomes)

## Chromosomes

- Humans have **46 chromosomes** (23 pairs)
- Made of **DNA** coiled around proteins
- Genes are sections of chromosomes`
          },
          {
            title: 'Transport in Cells',
            pageType: 'markdown',
            content: `# Transport in Cells

## Diffusion

**Definition**: Net movement of particles from high to low concentration.

### Factors Affecting Rate
- Concentration gradient (steeper = faster)
- Temperature (higher = faster)
- Surface area (larger = faster)

### Examples
- Oxygen into cells
- Carbon dioxide out of cells
- Glucose into cells

## Osmosis

**Definition**: Movement of water from dilute to concentrated solution through a partially permeable membrane.

### In Plant Cells
- **Turgid**: Full of water, firm (good!)
- **Plasmolysed**: Lost water, wilted

### In Animal Cells
- Too much water = burst (lysis)
- Too little water = crenation (shrivelled)

## Active Transport

**Definition**: Movement against concentration gradient using energy from respiration.

### Examples
- Mineral ions into root hair cells
- Glucose absorption in gut

### Requires
- ATP (energy)
- Carrier proteins`
          }
        ]
      },
      {
        title: 'Organisation',
        description: 'Levels of organisation in organisms and organ systems.',
        isPublished: true,
        isFree: false,
        pages: [
          {
            title: 'Levels of Organisation',
            pageType: 'markdown',
            content: `# Levels of Organisation

## Hierarchy of Organisation

**Cells → Tissues → Organs → Organ Systems → Organisms**

## Tissues

A group of similar cells working together.

### Examples
- **Muscle tissue**: Contracts to cause movement
- **Glandular tissue**: Produces substances like enzymes
- **Epithelial tissue**: Covers surfaces

## Organs

Different tissues working together.

### The Stomach
Contains:
- Muscular tissue (churns food)
- Glandular tissue (produces digestive juices)
- Epithelial tissue (covers inside and outside)

## Organ Systems

Multiple organs working together.

### The Digestive System
- Mouth → Oesophagus → Stomach → Small intestine → Large intestine
- Function: Break down food and absorb nutrients

## Plant Organs

- **Roots**: Absorb water and minerals
- **Stem**: Transport and support
- **Leaves**: Photosynthesis`
          },
          {
            title: 'The Digestive System',
            pageType: 'markdown',
            content: `# The Digestive System

## Overview

Breaks down large insoluble molecules into small soluble ones.

## Enzymes

### Carbohydrases
- Amylase breaks down starch → sugars
- Produced in salivary glands, pancreas, small intestine

### Proteases
- Break down proteins → amino acids
- Produced in stomach, pancreas, small intestine

### Lipases
- Break down fats → fatty acids + glycerol
- Produced in pancreas, small intestine

## Key Organs

### Stomach
- Produces pepsin (protease)
- Produces hydrochloric acid (pH 2)
- Churns food into chyme

### Liver
- Produces bile
- Bile stored in gall bladder
- Bile emulsifies fats, neutralises acid

### Pancreas
- Produces all three enzyme types
- Secretes into small intestine

### Small Intestine
- Produces enzymes
- Absorbs nutrients (villi increase surface area)`
          }
        ]
      }
    ]
  },
  {
    title: 'GCSE History - Medicine Through Time',
    description: 'Study of medical developments from ancient times to the present day, examining key individuals, discoveries, and public health reforms.',
    isPublished: true,
    isFree: false,
    chapters: [
      {
        title: 'Medieval Medicine (c.1250-1500)',
        description: 'Understanding medical beliefs and practices in the Medieval period.',
        isPublished: true,
        isFree: true,
        pages: [
          {
            title: 'Medieval Beliefs About Disease',
            pageType: 'markdown',
            content: `# Medieval Beliefs About Disease

## The Four Humours

Based on ancient Greek ideas from Hippocrates and Galen.

### The Four Humours
| Humour | Element | Season | Quality |
|--------|---------|--------|---------|
| Blood | Air | Spring | Hot & Wet |
| Yellow Bile | Fire | Summer | Hot & Dry |
| Black Bile | Earth | Autumn | Cold & Dry |
| Phlegm | Water | Winter | Cold & Wet |

### Treatment
- Balance humours through diet, purging, bloodletting

## Religious Beliefs

### Disease as Punishment
- Illness was God's punishment for sin
- Prayer and pilgrimage as cures
- Church controlled medical training

### The Role of the Church
- Monasteries preserved ancient texts
- Trained physicians at universities
- Controlled dissection (limited to 1 per year)

## Supernatural Beliefs

- Astrology influenced treatment
- Charms and spells used
- Flagellants during Black Death`
          },
          {
            title: 'Medieval Treatments and Practitioners',
            pageType: 'markdown',
            content: `# Medieval Treatments and Practitioners

## Types of Practitioners

### Physicians
- University trained (7+ years)
- Based diagnosis on urine charts
- Expensive, mainly for wealthy
- Didn't perform surgery

### Apothecaries
- Made and sold remedies
- Herbal medicines
- Accessible to more people

### Barber-Surgeons
- Performed minor surgery
- Bloodletting, tooth extraction
- Learned through apprenticeship

### Wise Women
- Local healers
- Herbal remedies
- Free/cheap treatment

## Common Treatments

### Bloodletting
- Cut vein or use leeches
- Remove "excess" blood
- Very popular treatment

### Purging
- Laxatives to empty bowels
- Clear "bad" humours

### Herbal Remedies
Some actually worked:
- Honey (antiseptic)
- Mint (digestion)
- Aloe vera (burns)`
          }
        ]
      },
      {
        title: 'The Medical Renaissance (c.1500-1700)',
        description: 'How the Renaissance transformed medical knowledge.',
        isPublished: true,
        isFree: false,
        pages: [
          {
            title: 'Vesalius and Anatomy',
            pageType: 'markdown',
            content: `# Vesalius and Anatomy

## Andreas Vesalius (1514-1564)

### Background
- Professor of Surgery at Padua
- Performed own dissections
- Published "De Humani Corporis Fabrica" (1543)

### Key Contributions

#### Proved Galen Wrong
- Lower jaw is ONE bone, not two
- Blood doesn't flow through septum of heart
- Identified over 200 errors in Galen's work

#### Changed Medical Education
- Emphasised importance of dissection
- Detailed anatomical drawings
- Challenged tradition of blindly following ancients

### Limitations
- Still couldn't explain how body worked
- Focused only on structure, not function
- Church opposition continued

## Impact on Medicine

### Short-term
- Slow acceptance (Galen still taught)
- Encouraged others to question

### Long-term
- Foundation of modern anatomy
- Changed how physicians were trained
- Paved way for Harvey's discoveries`
          },
          {
            title: 'William Harvey - Blood Circulation',
            pageType: 'markdown',
            content: `# William Harvey - Blood Circulation

## William Harvey (1578-1657)

### Background
- English physician
- Studied at Padua
- Royal physician to James I and Charles I

### Key Discovery

#### Blood Circulation (1628)
Published "De Motu Cordis"

### How He Proved It

1. **Calculation**
   - Measured heart's capacity
   - Calculated blood pumped per hour
   - Too much to be constantly made

2. **Experiments**
   - Tied tourniquets on arms
   - Showed blood flow direction
   - Observed valves in veins

3. **Dissection**
   - Studied over 80 animal species
   - Observed living animal hearts

### Significance

#### Short-term Impact
- Limited practical use
- Couldn't explain capillaries
- Bloodletting continued

#### Long-term Impact
- Foundation for understanding circulation
- Led to blood transfusions
- Inspired scientific methodology`
          }
        ]
      }
    ]
  }
]

async function seed() {
  console.log('🌱 Seeding GCSE courses...\n')

  for (const courseData of gcseCoursesData) {
    console.log(`📚 Creating course: ${courseData.title}`)

    // Insert course
    const [course] = await db.insert(courses).values({
      title: courseData.title,
      description: courseData.description,
      isPublished: courseData.isPublished,
      isFree: courseData.isFree,
      createdByClerkId: ADMIN_CLERK_ID,
    }).returning()

    // Insert chapters
    for (let chapterIndex = 0; chapterIndex < courseData.chapters.length; chapterIndex++) {
      const chapterData = courseData.chapters[chapterIndex]
      console.log(`  📖 Creating chapter: ${chapterData.title}`)

      const [chapter] = await db.insert(chapters).values({
        courseId: course.id,
        title: chapterData.title,
        description: chapterData.description,
        orderIndex: chapterIndex,
        isPublished: chapterData.isPublished,
        isFree: chapterData.isFree,
      }).returning()

      // Insert pages
      for (let pageIndex = 0; pageIndex < chapterData.pages.length; pageIndex++) {
        const pageData = chapterData.pages[pageIndex]
        console.log(`    📄 Creating page: ${pageData.title}`)

        const [page] = await db.insert(pages).values({
          chapterId: chapter.id,
          title: pageData.title,
          orderIndex: pageIndex,
          pageType: pageData.pageType,
        }).returning()

        // Insert markdown content
        if (pageData.pageType === 'markdown' && pageData.content) {
          await db.insert(markdownContent).values({
            pageId: page.id,
            content: pageData.content,
          })
        }
      }
    }

    console.log(`  ✅ Course created successfully!\n`)
  }

  console.log('🎉 All GCSE courses seeded successfully!')
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
