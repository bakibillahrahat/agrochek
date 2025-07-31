import { SampleType } from "../generated/prisma-client";

// Bangla to English translation map for common location names
const banglaToEnglishMap: { [key: string]: string } = {
  // Districts
  'ঢাকা': 'Dhaka',
  'চট্টগ্রাম': 'Chattogram',
  'সিলেট': 'Sylhet',
  'রাজশাহী': 'Rajshahi',
  'খুলনা': 'Khulna',
  'বরিশাল': 'Barisal',
  'রংপুর': 'Rangpur',
  'ময়মনসিংহ': 'Mymensingh',
  'কুমিল্লা': 'Cumilla',
  'গাজীপুর': 'Gazipur',
  'নারায়ণগঞ্জ': 'Narayanganj',
  'কক্সবাজার': 'Coxsbazar',
  'নোয়াখালী': 'Noakhali',
  'যশোর': 'Jashore',
  'দিনাজপুর': 'Dinajpur',
  'বগুড়া': 'Bogura',
  'পাবনা': 'Pabna',
  'ফরিদপুর': 'Faridpur',
  'কুষ্টিয়া': 'Kushtia',
  'মাদারীপুর': 'Madaripur',
  'গোপালগঞ্জ': 'Gopalganj',
  'শরীয়তপুর': 'Shariatpur',
  'রাজবাড়ী': 'Rajbari',
  'মানিকগঞ্জ': 'Manikganj',
  'মুন্সিগঞ্জ': 'Munshiganj',
  'টাঙ্গাইল': 'Tangail',
  'কিশোরগঞ্জ': 'Kishoreganj',
  'নেত্রকোণা': 'Netrokona',
  'জামালপুর': 'Jamalpur',
  'শেরপুর': 'Sherpur',
  'চাঁদপুর': 'Chandpur',
  'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria',
  'লক্ষ্মীপুর': 'Lakshmipur',
  'ফেনী': 'Feni',
  'রাঙ্গামাটি': 'Rangamati',
  'বান্দরবান': 'Bandarban',
  'খাগড়াছড়ি': 'Khagrachhari',
  'পটুয়াখালী': 'Patuakhali',
  'বরগুনা': 'Barguna',
  'ভোলা': 'Bhola',
  'পিরোজপুর': 'Pirojpur',
  'ঝালকাঠি': 'Jhalokati',
  'সাতক্ষীরা': 'Satkhira',
  'নড়াইল': 'Narail',
  'চুয়াডাঙ্গা': 'Chuadanga',
  'মেহেরপুর': 'Meherpur',
  'বাগেরহাট': 'Bagerhat',
  'মাগুরা': 'Magura',
  'নাটোর': 'Natore',
  'সিরাজগঞ্জ': 'Sirajganj',
  'চাঁপাইনবাবগঞ্জ': 'Chapainawabganj',
  'নওগাঁ': 'Naogaon',
  'জয়পুরহাট': 'Joypurhat',
  'ঠাকুরগাঁও': 'Thakurgaon',
  'পঞ্চগড়': 'Panchagarh',
  'লালমনিরহাট': 'Lalmonirhat',
  'নীলফামারী': 'Nilphamari',
  'কুড়িগ্রাম': 'Kurigram',
  'গাইবান্ধা': 'Gaibandha',
  'হবিগঞ্জ': 'Habiganj',
  'মৌলভীবাজার': 'Moulvibazar',
  'সুনামগঞ্জ': 'Sunamganj',
  
  // Common words
  'উপজেলা': 'Upazila',
  'জেলা': 'District',
  'বিভাগ': 'Division',
  'গ্রাম': 'Village',
  'পাড়া': 'Para',
  'মহল্লা': 'Moholla',
  'ওয়ার্ড': 'Ward',
  'রোড': 'Road',
  'পুর': 'Pur',
  'গঞ্জ': 'Ganj',
  'হাট': 'Hat',
  'বাজার': 'Bazar',
  'কোর্ট': 'Court',
  'স্কুল': 'School',
  'কলেজ': 'College',
  'বিশ্ববিদ্যালয়': 'University',
  'হাসপাতাল': 'Hospital',
  'ক্লিনিক': 'Clinic',
  'মসজিদ': 'Mosque',
  'মন্দির': 'Temple',
  'গির্জা': 'Church',
  'পার্ক': 'Park',
  'উদ্যান': 'Park',
  'স্টেশন': 'Station',
  'টার্মিনাল': 'Terminal',
  'ব্রিজ': 'Bridge',
  'সেতু': 'Bridge',
  'নদী': 'River',
  'পুকুর': 'Pond',
  'দীঘি': 'Dighi',
  'বিল': 'Bil',
  'হাওর': 'Haor'
};

// Function to check if text contains Bangla characters
function isBanglaText(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

// Function to translate Bangla text to English
function translateBanglaToEnglish(text: string): string {
  if (!isBanglaText(text)) {
    return text; // Return as is if not Bangla
  }

  let translatedText = text;
  
  // Replace Bangla words with English equivalents
  Object.keys(banglaToEnglishMap).forEach(banglaWord => {
    const englishWord = banglaToEnglishMap[banglaWord];
    const regex = new RegExp(banglaWord, 'g');
    translatedText = translatedText.replace(regex, englishWord);
  });

  return translatedText;
}

// Function to get the first two characters from institute address
function getInstitutePrefix(instituteAddress: string): string {
  let addressToProcess = instituteAddress;
  
  // If the address is in Bangla, translate it to English first
  if (isBanglaText(instituteAddress)) {
    addressToProcess = translateBanglaToEnglish(instituteAddress);
  }
  
  // Remove any non-alphabetic characters and get first 2 characters
  const cleanAddress = addressToProcess.replace(/[^a-zA-Z]/g, '');
  return cleanAddress.substring(0, 2).toUpperCase();
}

export function generateSampleId(sampleType: SampleType, instituteAddress: string): string {
  // Get the first two letters of the institute address (translate if Bangla)
  const institutePrefix = getInstitutePrefix(instituteAddress);
  
  // Get the sample type prefix
  let typePrefix: string;
  switch (sampleType) {
    case "SOIL":
      typePrefix = "S";
      break;
    case "WATER":
      typePrefix = "W";
      break;
    case "FERTILIZER":
      typePrefix = "F";
      break;
    default:
      typePrefix = "O"; // Other
  }
  
  // Generate a random number between 100 and 9999
  const randomNum = Math.floor(Math.random() * 9900) + 100;
  
  // Combine the parts: InstitutePrefix-TypePrefix-RandomNumber
  return `${institutePrefix}-${typePrefix}${randomNum}`;
}

// Export utility functions for potential reuse
export { isBanglaText, translateBanglaToEnglish, getInstitutePrefix };