// Festival imagery for the Festive & Seasonal section.
//
// Curated, freely-licensed photos from Wikimedia Commons, keyed by
// festival slug. Festivals without a curated photo fall back to the
// artwork of their top song, so the section is never imageless.
export interface FestivalImage {
  url: string;
  /** Short attribution shown in the photo credit. */
  credit: string;
  license: string;
  /** Link to the source file page (for attribution). */
  creditUrl: string;
}

export const FESTIVAL_IMAGES: Record<string, FestivalImage> = {
  "dashain": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Soaring_High_in_Dashain.jpg/1280px-Soaring_High_in_Dashain.jpg",
    credit: "Safalphotos",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Soaring_High_in_Dashain.jpg",
  },
  "tihar": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Sister_lighting_traditional_lamp_during_Tihar_festival_%28edited%29.jpg/1280px-Sister_lighting_traditional_lamp_during_Tihar_festival_%28edited%29.jpg",
    credit: "Original: Mithun Kunwar Derivative work: Radomianin",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Sister_lighting_traditional_lamp_during_Tihar_festival_(edited).jpg",
  },
  "teej": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Teej.jpg/1280px-Teej.jpg",
    credit: "Ganesh Paudel at ne.wikipedia",
    license: "CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Teej.jpg",
  },
  "chitrabhan": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Sindoor_Jatra_02.jpg/1280px-Sindoor_Jatra_02.jpg",
    credit: "Proxodimec",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Sindoor_Jatra_02.jpg",
  },
  "sonam-lhosar": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Tamang_Sonam_Lochhar_2018_DC_%2839446275955%29_%281%29_cropped.jpg/1280px-Tamang_Sonam_Lochhar_2018_DC_%2839446275955%29_%281%29_cropped.jpg",
    credit: "S Pakhrin from DC, USA",
    license: "CC BY 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Tamang_Sonam_Lochhar_2018_DC_(39446275955)_(1)_cropped.jpg",
  },
  "buddha-jayanti": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Buddha_Jayanti-IMG_9120.jpg/1280px-Buddha_Jayanti-IMG_9120.jpg",
    credit: "Bijaya2043",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Buddha_Jayanti-IMG_9120.jpg",
  },
  "maha-shivaratri": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Sadhu_Giving_Blessings_to_a_Devotee_During_Maha_Shivaratri_at_Pashupatinath_Temple%2C_Kathmandu%2C_Nepal-070A6924.jpg/1280px-Sadhu_Giving_Blessings_to_a_Devotee_During_Maha_Shivaratri_at_Pashupatinath_Temple%2C_Kathmandu%2C_Nepal-070A6924.jpg",
    credit: "Bijay Chaurasia",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Sadhu_Giving_Blessings_to_a_Devotee_During_Maha_Shivaratri_at_Pashupatinath_Temple,_Kathmandu,_Nepal-070A6924.jpg",
  },
  "chhath": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/JanakpurChhathParvaFestival.jpg/1280px-JanakpurChhathParvaFestival.jpg",
    credit: "Steffen Gauger",
    license: "CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:JanakpurChhathParvaFestival.jpg",
  },
  "maghe-sankranti": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Maghe_Sankranti_Feast.jpg/1280px-Maghe_Sankranti_Feast.jpg",
    credit: "Gaurav Dhwaj Khadka",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Maghe_Sankranti_Feast.jpg",
  },
  "holi": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Joy_of_Holi_celebration.jpg/1280px-Joy_of_Holi_celebration.jpg",
    credit: "Wikimedman",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Joy_of_Holi_celebration.jpg",
  },
  "ram-navami": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Ram_Temple_Pashupatinath_Kathmandu_Nepal_Rajesh_Dhungana_%281%29.jpg/1280px-Ram_Temple_Pashupatinath_Kathmandu_Nepal_Rajesh_Dhungana_%281%29.jpg",
    credit: "Rajesh Dhungana",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Ram_Temple_Pashupatinath_Kathmandu_Nepal_Rajesh_Dhungana_(1).jpg",
  },
  "janai-purnima": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Janai_purnima_Festival_in_Nagarkot.jpg/1280px-Janai_purnima_Festival_in_Nagarkot.jpg",
    credit: "Ekant sw",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Janai_purnima_Festival_in_Nagarkot.jpg",
  },
  "krishna-janmashtami": {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/22/Janmashtami_01.jpg",
    credit: "Krish Dulal",
    license: "CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Janmashtami_01.jpg",
  },
  "gai-jatra": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Gai_Jatra_Kathmandu_Nepal_%285116623694%29.jpg/1280px-Gai_Jatra_Kathmandu_Nepal_%285116623694%29.jpg",
    credit: "S Pakhrin from DC, USA",
    license: "CC BY 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Gai_Jatra_Kathmandu_Nepal_(5116623694).jpg",
  },
  "indra-jatra": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Indra_Jatra_Festival_in_Nepal.jpg/1280px-Indra_Jatra_Festival_in_Nepal.jpg",
    credit: "Skandagautam",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Indra_Jatra_Festival_in_Nepal.jpg",
  },
  "bisket-jatra": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Bisket_Jatra_festival_2018_at_the_Nyatapola_temple%2C_Bhaktapur.jpg/1280px-Bisket_Jatra_festival_2018_at_the_Nyatapola_temple%2C_Bhaktapur.jpg",
    credit: "Nrik kiran",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Bisket_Jatra_festival_2018_at_the_Nyatapola_temple,_Bhaktapur.jpg",
  },
  "tamu-lhosar": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Gurung_Tamu_Lhosar_2018_01.jpg/1280px-Gurung_Tamu_Lhosar_2018_01.jpg",
    credit: "S Pakhrin",
    license: "CC BY 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Gurung_Tamu_Lhosar_2018_01.jpg",
  },
  "gyalpo-lhosar": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Gyalpo_Lhosar_2146.jpg/1280px-Gyalpo_Lhosar_2146.jpg",
    credit: "S Pakhrin",
    license: "CC BY 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Gyalpo_Lhosar_2146.jpg",
  },
  "yomari-punhi": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Yomari_%E2%80%93_Traditional_Newari_Sweet_of_Nepal.jpg/1280px-Yomari_%E2%80%93_Traditional_Newari_Sweet_of_Nepal.jpg",
    credit: "SristiAwasthi21",
    license: "CC0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Yomari_%E2%80%93_Traditional_Newari_Sweet_of_Nepal.jpg",
  },
  "christmas": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Avenue_des_Champs-Elys%C3%A9es%2C_Paris_12_December_2020.jpg/1280px-Avenue_des_Champs-Elys%C3%A9es%2C_Paris_12_December_2020.jpg",
    credit: "Pierre Blaché from Paris, France",
    license: "CC0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Avenue_des_Champs-Elys%C3%A9es,_Paris_12_December_2020.jpg",
  },
  "eid": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Eid_al-Fitr_Prayer_at_Al-Nour_Al-Kabeer_Mosque%2C_Kirkuk%2C_Iraq_05.jpg/1280px-Eid_al-Fitr_Prayer_at_Al-Nour_Al-Kabeer_Mosque%2C_Kirkuk%2C_Iraq_05.jpg",
    credit: "Enasiqph",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Eid_al-Fitr_Prayer_at_Al-Nour_Al-Kabeer_Mosque,_Kirkuk,_Iraq_05.jpg",
  },
  "udhauli-ubhauli": {
    url: "https://upload.wikimedia.org/wikipedia/commons/1/14/Kirat_Rai_Girls_Dancing_Sakela_2019_Ashford_Kent_UK.jpg",
    credit: "Raibisu43",
    license: "CC BY-SA 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Kirat_Rai_Girls_Dancing_Sakela_2019_Ashford_Kent_UK.jpg",
  },
  "gaura-parva": {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Gaura_festival1.jpg/1280px-Gaura_festival1.jpg",
    credit: "रमेश सिंह बोहरा",
    license: "CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Gaura_festival1.jpg",
  },
};

/** Return the curated photo for a festival slug, if one exists. */
export const festivalImage = (slug?: string | null): FestivalImage | null =>
  (slug && FESTIVAL_IMAGES[slug]) || null;
