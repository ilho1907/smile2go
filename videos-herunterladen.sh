#!/bin/bash
# smile2go — alle 23 Higgsfield-4K-Videos + Poster herunterladen
# Ausführen:  bash ~/Desktop/smile2go-projekt/videos-herunterladen.sh

set -e
HF="https://d8j0ntlcm91z4.cloudfront.net/user_38M7vUEZt4QSLH4tMycofRwoTS7"
VID="$HOME/Desktop/smile2go-projekt/app/public/media/video"
IMG="$HOME/Desktop/smile2go-projekt/app/public/media/img"
mkdir -p "$VID" "$IMG"

dl() { # dl <zielname> <dateiname-auf-cdn> <ordner>
  printf "  %-14s " "$1"
  if curl -fsS -o "$3/$1" "$HF/$2"; then
    echo "OK  ($(du -h "$3/$1" | cut -f1))"
  else
    echo "FEHLER"
  fi
}

echo "== Videos (4K, 9:16, mit Ton) =="
dl orakel.mp4       hf_20260715_231340_f97d8daa-5ae1-43ee-8c75-a8a6644e8e6d.mp4 "$VID"
dl coaching.mp4     hf_20260715_231412_77d58d88-1670-4787-9d60-ea6b982acd94.mp4 "$VID"
dl challenge.mp4    hf_20260715_231628_ce9e9b19-9ce5-4364-957d-eedd92d1d333.mp4 "$VID"
dl journal.mp4      hf_20260715_231632_8abbd02f-591f-458f-87b7-c0232242ecfd.mp4 "$VID"
dl rituale.mp4      hf_20260715_231635_4c5f69dc-364b-4e02-8eee-29a2b978cca8.mp4 "$VID"
dl brief.mp4        hf_20260715_231640_88298e5e-0acf-4eb1-bf93-3c00957472c1.mp4 "$VID"
dl fuelle.mp4       hf_20260715_231644_6af729f6-799e-42bd-9fae-6e8eb8594039.mp4 "$VID"
dl podcast.mp4      hf_20260715_231807_8a55cde5-2f68-48e9-a795-0ac063d2f043.mp4 "$VID"
dl meditation.mp4   hf_20260715_231817_55132788-8862-446b-a8c2-bf76681b653d.mp4 "$VID"
dl mediathek.mp4    hf_20260715_231928_42144bf3-9901-4546-9f66-fe321b5c4a68.mp4 "$VID"
dl heute.mp4        hf_20260715_233456_7c8c8ad7-5d08-46c9-8b54-6df61df35a21.mp4 "$VID"
dl mehr.mp4         hf_20260715_233459_d5158df3-31cf-45ed-ac9e-efbfcd49793b.mp4 "$VID"
dl ziele.mp4        hf_20260715_233502_08838701-6270-4d7c-9888-f1f7be41786a.mp4 "$VID"
dl aufgaben.mp4     hf_20260715_233504_bfb92ce6-ebf8-44c2-9cea-adbdcb33ea5a.mp4 "$VID"
dl community.mp4    hf_20260715_233507_75927f85-eda8-4e1e-97da-a42233357afd.mp4 "$VID"
dl fortschritt.mp4  hf_20260715_233511_e9e3839e-eacc-4477-908d-1ac30a467508.mp4 "$VID"
dl buchen.mp4       hf_20260715_233514_a57d163c-03a9-41a3-8f23-b704f2c2c69a.mp4 "$VID"
dl coach.mp4        hf_20260715_233517_ae05dc57-b7f4-41c1-a3cd-dd5df94561b3.mp4 "$VID"
dl pakete.mp4       hf_20260715_233520_f1bdda28-37cd-46cd-9079-61ad7fdd7fe8.mp4 "$VID"
dl fragebogen.mp4   hf_20260715_233523_aeba7054-8a6a-4f6b-aeb6-359f56b5ce6e.mp4 "$VID"
dl appguide.mp4     hf_20260715_233526_3e3363f8-ddfd-431c-924e-903ba4df4ded.mp4 "$VID"
dl profil.mp4       hf_20260715_233529_e71fb115-5b6c-47a3-a3f8-6ddf6e6dddee.mp4 "$VID"
dl kurse.mp4        hf_20260715_233922_46831acd-dbeb-4251-a44d-1299b5698341.mp4 "$VID"

echo ""
echo "== Poster-Bilder =="
dl orakel.png       hf_20260715_231226_703bb6d2-2492-4231-9e47-18eb1af3ed6a.png "$IMG"
dl coaching.png     hf_20260715_231237_ac48a110-6c8b-4e05-803b-61075ca9af44.png "$IMG"
dl challenge.png    hf_20260715_231453_e3de4d7c-d03c-49bc-ba61-736ea19d41a0.png "$IMG"
dl journal.png      hf_20260715_231455_73c31c56-5a72-48b9-9261-85f335097109.png "$IMG"
dl rituale.png      hf_20260715_231459_d8d3b091-4e95-4f86-9128-9cf9552d9dd7.png "$IMG"
dl brief.png        hf_20260715_231502_93dfd9b3-d048-4845-acb7-ffdf17845254.png "$IMG"
dl fuelle.png       hf_20260715_231505_e19df46c-3bb4-4cb0-9c81-3232b371a4a3.png "$IMG"
dl mediathek.png    hf_20260715_231648_8b7fa9e1-e08d-47f4-be59-9d7c74428f57.png "$IMG"
dl meditation.png   hf_20260715_231650_78aa0c65-c67a-4ef4-84dd-4d2ff420b4b3.png "$IMG"
dl podcast.png      hf_20260715_231653_65c37c5e-3318-4697-aa7c-e75ce9cefcca.png "$IMG"
dl heute.png        hf_20260715_233248_e113e356-0ad9-4708-a49c-248da9e12371.png "$IMG"
dl mehr.png         hf_20260715_233250_59b0ccf4-4305-4294-b3c1-d9add7726a19.png "$IMG"
dl ziele.png        hf_20260715_233253_c6df8476-d375-48cc-bf11-78b101ebd718.png "$IMG"
dl aufgaben.png     hf_20260715_233255_c7431c62-ad86-4651-81a2-2fb9903ffda2.png "$IMG"
dl community.png    hf_20260715_233258_9665b4ca-6c88-47f7-89bb-92725cf876f2.png "$IMG"
dl fortschritt.png  hf_20260715_233301_b0cac443-8963-48fd-a5b4-99e26c2c2b1d.png "$IMG"
dl buchen.png       hf_20260715_233303_eeedeb12-00c9-407f-9653-4df75c687362.png "$IMG"
dl coach.png        hf_20260715_233306_1981e25a-6f33-4242-a613-6d281a6d1df3.png "$IMG"
dl pakete.png       hf_20260715_233308_b238dcc3-6154-456a-a5e2-5ccf4a7fa51d.png "$IMG"
dl fragebogen.png   hf_20260715_233310_f35ca09a-b8cc-4b10-9bca-8c73486095b0.png "$IMG"
dl appguide.png     hf_20260715_233313_9f1a973f-dc85-4c01-9ab0-61a4d8300c5d.png "$IMG"
dl profil.png       hf_20260715_233315_ef504c15-8bb0-4e6e-a6b3-3f0358fcdad1.png "$IMG"
dl kurse.png        hf_20260715_233810_cd24d822-2177-4837-9738-86058bd4151b.png "$IMG"

echo ""
echo "Fertig. Videos: $VID"
echo "        Poster: $IMG"
echo ""
echo "Danach in app/src/media.js die Zeile"
echo '  const HF = "https://d8j0ntlcm91z4.cloudfront.net/..."'
echo "durch lokale Pfade ersetzen: /media/video/<name>.mp4 bzw. /media/img/<name>.png"
