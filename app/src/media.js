// media.js — smile2go asset manifest
// Alle Dateien liegen lokal in /public/media (im Build unter /media/...).
// NEU (2026-07): Higgsfield 4K-Kinovideos (Kling 3.0, 2160×3840, mit Ton)
// werden vom CDN gestreamt. Für Production: Dateien herunterladen und
// nach /public/media/video/ legen, dann Pfade unten auf /media/video/... ändern.
const HF = "https://d8j0ntlcm91z4.cloudfront.net/user_38M7vUEZt4QSLH4tMycofRwoTS7";

// Schattenspiegel — Verbrennungs-Ritual: Higgsfield-Video (Seedance 2.0, 4K, 2160×3840, 9:16, mit nativem Ton)
export const FEUER_VIDEO = `${HF}/hf_20260728_162308_09b35acf-3ce7-4e67-a8bb-59f77eefd3c8.mp4`;

// Orakel-Kartenbilder (Higgsfield · nano_banana_pro, 4K, 3:4) — 44-Karten-Göttinnen-Deck, einheitlicher 8K-3D-HD-Kartenstil
export const KARTEN = {
  "Die Göttin der lebendigen Schöpfung": `${HF}/hf_20260724_170623_1a9c6d58-26e3-4bb7-95a1-ead35c42d451.png`,
  "Gaia":                                `${HF}/hf_20260724_170912_df824120-97d3-4499-9af6-f67fd5b5f0f2.png`,
  "Isis":                                `${HF}/hf_20260724_170915_6dac34ac-a969-45a2-ac3b-fb79b2c403aa.png`,
  "Freya":                               `${HF}/hf_20260724_170917_47ad0fc5-6455-4f7e-bd1b-d78b96703a1d.png`,
  "Brigid":                              `${HF}/hf_20260724_170920_31b3506c-b8b5-4cbd-9445-d42ec0cb7063.png`,
  "Pachamama":                           `${HF}/hf_20260724_170923_59c4e979-b967-49de-aad3-fd6a83ba40d5.png`,
  "Danu":                                `${HF}/hf_20260724_170925_cc78bb6d-5e94-41d6-8a98-61f244b547d5.png`,
  "Abundantia":                          `${HF}/hf_20260724_170928_bb73f83b-a410-466a-a9fc-0851fe711c76.png`,
  "Fortuna":                             `${HF}/hf_20260724_170930_72c617c1-6d5e-4d81-9694-65024a0e3bef.png`,
  "Lakshmi":                             `${HF}/hf_20260724_170945_1af999cb-309c-4242-8632-b35c114449bb.png`,
  "Demeter":                             `${HF}/hf_20260724_170948_4b0ff563-5ece-4063-ada4-8b852119ab74.png`,
  "Ops":                                 `${HF}/hf_20260724_170951_3d005389-67d6-4b54-923f-b958b002b391.png`,
  "Rosmerta":                            `${HF}/hf_20260724_170953_361cf6c2-9a66-40c7-825f-2db3b66b4520.png`,
  "Juno Moneta":                         `${HF}/hf_20260724_170956_916de67f-16d4-4e3c-a16a-e6eaf6f0c756.png`,
  "Persephone":                          `${HF}/hf_20260724_170958_30dc2f6e-763b-454f-8d3b-02812f57c861.png`,
  "Kali":                                `${HF}/hf_20260724_171001_a11163b5-e948-4802-84db-c18fe1e64791.png`,
  "Hekate":                              `${HF}/hf_20260724_171003_a1e541bf-2760-4297-9992-3d148ce17d7d.png`,
  "Morrigan":                            `${HF}/hf_20260724_171018_33985932-7c85-485c-93f1-deabe3422745.png`,
  "Cerridwen":                           `${HF}/hf_20260724_171020_45f3de1c-9f61-4990-bfc9-32c7898c6662.png`,
  "Nephthys":                            `${HF}/hf_20260724_171023_6f4aec37-7d3a-458b-98b4-09b21297ceea.png`,
  "Ereshkigal":                          `${HF}/hf_20260724_171025_c9e6ae9d-52b2-43e0-9fe8-81c5637782fd.png`,
  "Athene":                              `${HF}/hf_20260724_171028_21104173-159f-41f9-ba8c-c6bfebac68a2.png`,
  "Saraswati":                           `${HF}/hf_20260724_171031_01cffcee-ed33-4261-87de-da846f535ade.png`,
  "Sophia":                              `${HF}/hf_20260724_171033_32968c8b-da09-45cd-b4c0-4f79b2425644.png`,
  "Seshat":                              `${HF}/hf_20260724_171036_895f447b-9f58-4642-9e5f-a69bf6d09be0.png`,
  "Minerva":                             `${HF}/hf_20260724_171051_75fae9e7-439a-4616-bb25-d28b62a9a09d.png`,
  "Metis":                               `${HF}/hf_20260724_171054_5eb4f9e5-d52a-49d0-ba41-0d357cd4d373.png`,
  "Nisaba":                              `${HF}/hf_20260724_171057_9f501c8c-8be8-42a6-a953-a35b78e857ac.png`,
  "Aphrodite":                           `${HF}/hf_20260724_171059_f155147a-44c5-4bbf-9b2c-5394648dd506.png`,
  "Kuan Yin":                            `${HF}/hf_20260724_171102_96048791-e640-48b3-a53b-cc191e792821.png`,
  "Hathor":                              `${HF}/hf_20260724_171104_1995d732-94f9-428a-9585-a0a1227220f8.png`,
  "Tara":                                `${HF}/hf_20260724_171107_5128d0b3-4807-491b-9937-6d716486aafa.png`,
  "Parvati":                             `${HF}/hf_20260724_171108_95cf8321-1271-4feb-87d0-15709f69ea54.png`,
  "Oshun":                               `${HF}/hf_20260724_171122_e4216209-a053-4d2a-b0df-f03361038a38.png`,
  "Venus":                               `${HF}/hf_20260724_171125_9698c999-745c-4fa7-9e65-bfce29d18f68.png`,
  "Radha":                               `${HF}/hf_20260724_171127_dc92cd2a-b334-4a26-b1f0-37ef6d7b0ff3.png`,
  "Artemis":                             `${HF}/hf_20260724_171130_97fed200-0770-45b6-9cc0-762dee5e0479.png`,
  "Hestia":                              `${HF}/hf_20260724_171133_79c6abae-44ec-45f0-8772-fad4ef487256.png`,
  "Diana":                               `${HF}/hf_20260724_171135_7274e263-4616-498e-808e-eac4eeeddeac.png`,
  "Durga":                               `${HF}/hf_20260724_171138_4a0e09a3-0249-4ad4-be42-5b9b9514a400.png`,
  "Nike":                                `${HF}/hf_20260724_171140_68a29eb8-0f13-4a29-b5be-02aa134190a0.png`,
  "Vesta":                               `${HF}/hf_20260724_171151_a974b61a-bd60-405d-85bd-5790e14a435a.png`,
  "Skadi":                               `${HF}/hf_20260724_171153_47da5b8d-18c2-4e14-bfe5-0717f2fb7ed2.png`,
  "Sekhmet":                             `${HF}/hf_20260724_171156_429c6cdd-aa16-419e-9735-b5e085e333ff.png`,
};

export const IMG = {
  orakel:      `${HF}/hf_20260715_231226_703bb6d2-2492-4231-9e47-18eb1af3ed6a.png`,
  lichtpunkte: "/media/img/lichtpunkte.png",
  welcome:     "/media/img/welcome.png",
  podcast:     `${HF}/hf_20260715_231653_65c37c5e-3318-4697-aa7c-e75ce9cefcca.png`,
  meditation:  `${HF}/hf_20260715_231650_78aa0c65-c67a-4ef4-84dd-4d2ff420b4b3.png`,
  coaching:    `${HF}/hf_20260715_231237_ac48a110-6c8b-4e05-803b-61075ca9af44.png`,
  challenge:   `${HF}/hf_20260715_231453_e3de4d7c-d03c-49bc-ba61-736ea19d41a0.png`,
  journal:     `${HF}/hf_20260715_231455_73c31c56-5a72-48b9-9261-85f335097109.png`,
  rituale:     `${HF}/hf_20260715_231459_d8d3b091-4e95-4f86-9128-9cf9552d9dd7.png`,
  brief:       `${HF}/hf_20260715_231502_93dfd9b3-d048-4845-acb7-ffdf17845254.png`,
  fuelle:      `${HF}/hf_20260715_231505_e19df46c-3bb4-4cb0-9c81-3232b371a4a3.png`,
  mediathek:   `${HF}/hf_20260715_231648_8b7fa9e1-e08d-47f4-be59-9d7c74428f57.png`,
  heute:       `${HF}/hf_20260715_233248_e113e356-0ad9-4708-a49c-248da9e12371.png`,
  mehr:        `${HF}/hf_20260715_233250_59b0ccf4-4305-4294-b3c1-d9add7726a19.png`,
  ziele:       `${HF}/hf_20260715_233253_c6df8476-d375-48cc-bf11-78b101ebd718.png`,
  aufgaben:    `${HF}/hf_20260715_233255_c7431c62-ad86-4651-81a2-2fb9903ffda2.png`,
  community:   `${HF}/hf_20260715_233258_9665b4ca-6c88-47f7-89bb-92725cf876f2.png`,
  fortschritt: `${HF}/hf_20260715_233301_b0cac443-8963-48fd-a5b4-99e26c2c2b1d.png`,
  buchen:      `${HF}/hf_20260715_233303_eeedeb12-00c9-407f-9653-4df75c687362.png`,
  coach:       `${HF}/hf_20260715_233306_1981e25a-6f33-4242-a613-6d281a6d1df3.png`,
  pakete:      `${HF}/hf_20260715_233308_b238dcc3-6154-456a-a5e2-5ccf4a7fa51d.png`,
  fragebogen:  `${HF}/hf_20260715_233310_f35ca09a-b8cc-4b10-9bca-8c73486095b0.png`,
  appguide:    `${HF}/hf_20260715_233313_9f1a973f-dc85-4c01-9ab0-61a4d8300c5d.png`,
  profil:      `${HF}/hf_20260715_233315_ef504c15-8bb0-4e6e-a6b3-3f0358fcdad1.png`,
  kurse:       `${HF}/hf_20260715_233810_cd24d822-2177-4837-9738-86058bd4151b.png`,
};
export const VIDEO = {
  orakel:      `${HF}/hf_20260715_231340_f97d8daa-5ae1-43ee-8c75-a8a6644e8e6d.mp4`,
  meditation:  `${HF}/hf_20260715_231817_55132788-8862-446b-a8c2-bf76681b653d.mp4`,
  podcast:     `${HF}/hf_20260715_231807_8a55cde5-2f68-48e9-a795-0ac063d2f043.mp4`,
  coaching:    `${HF}/hf_20260715_231412_77d58d88-1670-4787-9d60-ea6b982acd94.mp4`,
  challenge:   `${HF}/hf_20260715_231628_ce9e9b19-9ce5-4364-957d-eedd92d1d333.mp4`,
  journal:     `${HF}/hf_20260715_231632_8abbd02f-591f-458f-87b7-c0232242ecfd.mp4`,
  rituale:     `${HF}/hf_20260715_231635_4c5f69dc-364b-4e02-8eee-29a2b978cca8.mp4`,
  brief:       `${HF}/hf_20260715_231640_88298e5e-0acf-4eb1-bf93-3c00957472c1.mp4`,
  fuelle:      `${HF}/hf_20260715_231644_6af729f6-799e-42bd-9fae-6e8eb8594039.mp4`,
  mediathek:   `${HF}/hf_20260715_231928_42144bf3-9901-4546-9f66-fe321b5c4a68.mp4`,
  heute:       `${HF}/hf_20260715_233456_7c8c8ad7-5d08-46c9-8b54-6df61df35a21.mp4`,
  mehr:        `${HF}/hf_20260715_233459_d5158df3-31cf-45ed-ac9e-efbfcd49793b.mp4`,
  ziele:       `${HF}/hf_20260715_233502_08838701-6270-4d7c-9888-f1f7be41786a.mp4`,
  aufgaben:    `${HF}/hf_20260715_233504_bfb92ce6-ebf8-44c2-9cea-adbdcb33ea5a.mp4`,
  community:   `${HF}/hf_20260715_233507_75927f85-eda8-4e1e-97da-a42233357afd.mp4`,
  fortschritt: `${HF}/hf_20260715_233511_e9e3839e-eacc-4477-908d-1ac30a467508.mp4`,
  buchen:      `${HF}/hf_20260715_233514_a57d163c-03a9-41a3-8f23-b704f2c2c69a.mp4`,
  coach:       `${HF}/hf_20260715_233517_ae05dc57-b7f4-41c1-a3cd-dd5df94561b3.mp4`,
  pakete:      `${HF}/hf_20260715_233520_f1bdda28-37cd-46cd-9079-61ad7fdd7fe8.mp4`,
  fragebogen:  `${HF}/hf_20260715_233523_aeba7054-8a6a-4f6b-aeb6-359f56b5ce6e.mp4`,
  appguide:    `${HF}/hf_20260715_233526_3e3363f8-ddfd-431c-924e-903ba4df4ded.mp4`,
  profil:      `${HF}/hf_20260715_233529_e71fb115-5b6c-47a3-a3f8-6ddf6e6dddee.mp4`,
  kurse:       `${HF}/hf_20260715_233922_46831acd-dbeb-4251-a44d-1299b5698341.mp4`,
  lichtpunkte: "/media/video/lichtpunkte.mp4",
  welcome:     "/media/video/welcome.mp4",
  ad9x16:      "/media/video/ad_9x16.mp4",
  ad16x9:      "/media/video/ad_16x9.mp4",
};
export const AUDIO = {
  meditation:  "/media/audio/meditation.wav",
  welcome:     "/media/audio/welcome.wav",
  lichtpunkte: "/media/audio/lichtpunkte.wav",
  podcast:     "/media/audio/podcast.wav",
  dankbarkeit: "/media/audio/dankbarkeit.wav",
  brief:       "/media/audio/brief.wav",
  tagebuch:    "/media/audio/tagebuch.wav",
};

// Sprach-Prompts (Voiceover-Texte, passend zu den Audios)
export const VOICE = {
  meditation:  "Willkommen. Atme tief ein … und langsam wieder aus.",
  welcome:     "Schön, dass du da bist. Dies ist dein Rückzugsort.",
  lichtpunkte: "Wunderbar. Fünf Lichtpunkte für dich.",
  dankbarkeit: "Wofür bist du heute dankbar?",
  brief:       "Ein Brief an dich selbst — an die Frau in einem Jahr.",
  tagebuch:    "Dies ist dein Raum. Kein richtig, kein falsch.",
};

export const PALETTE = {
  bg: "#F6EFE4", card: "#FFFDF9", gold: "#C9A24B",
  rose: "#D89AA6", sage: "#93B09A", ink: "#4A3B2C", mut: "#A2917B",
};
