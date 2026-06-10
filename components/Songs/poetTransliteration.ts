const POET_HI_TO_EN: Record<string, string> = {
  'प्रीत तो ऐसी कीजिये': 'Preet To Aisi Keejiye',
  'गागर ऊपर गागरी': 'Gagar Upar Gagari',
  'बदरा उठा प्रेम का': 'Badra Utha Prem Ka',
  'फ़िक्र सब को खा गयी': 'Fikr Sab Ko Kha Gayi',
  'इश्क़ का ज़र्फ़ आज़मा तो सही': 'Ishq Ka Zarf Aazma To Sahi',
  'करगल कूच कुन्न घणा': 'Kargal Kooch Kunn Ghana',
  'लागी लागी सब कहें': 'Laagi Laagi Sab Kahein',
  'डूंगर डस पिरियण जो': 'Dungar Das Piriyan Jo',
  'अज पण उत्तर पारडे': 'Aj Pan Uttar Paarde',
  'अब लफ़्ज़-ओ-बयान सब ख़त्म हुए': 'Ab Lafz-o-Bayaan Sab Khatm Hue',
  'डुख लगो डूंगर बरियो': 'Dukh Lago Dungar Bariyo',
  'आगम कयो अचन': 'Aagam Kayo Achan',
  'चंड, चवांए हक': 'Chand, Chavaae Hak',
  'मींहा ऐ नींहा': 'Meenha Ai Neenha',
  'वसण अखड़ीयुन जींह': 'Vasan Akhadiyun Jeenh',
  'चढ़न चरी कई': 'Chadhan Chari Kai',
  'एक शाहिद-ए-मानी-ओ-सूरत के': 'Ek Shaahid-e-Maani-o-Surat Ke',
  'आ पिया मोरे नैनन में': 'Aa Piya More Nainan Mein',
  'राम नाम की खूंटी गाड़ी': 'Ram Naam Ki Khunti Gaadi',
  'थप के क़ुरान दंबूर गिधोने': 'Thap Ke Quran Dambur Gidhone',
  'कबीर कबीर क्या करो': 'Kabir Kabir Kya Karo',
  'मैं मरजीवा समुद्र का': 'Main Marjeeva Samudra Ka',
  'उभरंदे सिज सां': 'Ubhrande Sij Saan',
  'दौड़ैत दौड़त दौड़िया': 'Daudait Daudat Daudiya',
  'हाँ कहूं तो है नहीं': 'Haan Kahun To Hai Nahin',
  'साहिब तुझ में यूं बसे': 'Sahib Tujh Mein Yun Base',
  'तन तस्बी मन मणियो': 'Tan Tasbi Man Maniyo',
  'धीरे धीरे रे मना': 'Dheere Dheere Re Mana',
  'निराकार निर्भय तू ही': 'Nirakaar Nirbhay Tu Hi',
  'तन तम्बूरा तार मन': 'Tan Tambura Taar Man',
  'सूफ़ी ला कूफ़ी': 'Sufi La Kufi',
  'सरमद बा जहान-ए-कोहना': 'Sarmad Ba Jahaan-e-Kohna',
  'साजन यह मत जानियो': 'Saajan Yeh Mat Jaaniyo',
  'दीपक ज्योत पतंग': 'Deepak Jyot Patang',
  'माई नी मैं रांझा ढूंढ़न चली': 'Maai Ni Main Ranjha Dhoondhan Chali',
  'लकड़ी जल कोयला भयी': 'Lakdi Jal Koyla Bhayi',
  'भीखा भूखा कोऊ ना': 'Bhikha Bhookha Koū Na',
  'कागा सब तन खाइयो': 'Kaaga Sab Tan Khaayio',
  'ओडूं बांग वाही': 'Odun Baang Vaahi',
  'गुरु हमारा गगन में': 'Guru Hamaara Gagan Mein',
  'बिन पावन का पंथ है': 'Bin Paavan Ka Panth Hai',
  'यह तन विष की बेलड़ी': 'Yeh Tan Vish Ki Beldi',
  'गाया बिन पाया नहीं': 'Gaaya Bin Paaya Nahin',
  "'फ़े' फ़कीर फ़िक्र विच होए": "'Fe' Faqeer Fikr Vich Hoe",
  'दुनिया सब दरिया': 'Duniya Sab Dariya',
};

const DEVANAGARI_RE = /[\u0900-\u097F]/;

export function toEnglishPoet(value: string | undefined | null): string {
  if (!value) return '';
  const key = String(value).trim();
  if (POET_HI_TO_EN[key]) return POET_HI_TO_EN[key];
  if (DEVANAGARI_RE.test(key)) {
    for (const k of Object.keys(POET_HI_TO_EN)) {
      if (k.includes(key) || key.includes(k)) return POET_HI_TO_EN[k];
    }
  }
  return key;
}
