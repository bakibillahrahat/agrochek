// Test file to demonstrate the updated sampleIdGenerator functionality
import { generateSampleId, isBanglaText, translateBanglaToEnglish, getInstitutePrefix } from './sampleIdGenerator';

// Test cases
console.log('=== Testing Bangla Text Detection ===');
console.log('isBanglaText("ঢাকা"):', isBanglaText('ঢাকা')); // true
console.log('isBanglaText("Dhaka"):', isBanglaText('Dhaka')); // false

console.log('\n=== Testing Bangla to English Translation ===');
console.log('translateBanglaToEnglish("ঢাকা"):', translateBanglaToEnglish('ঢাকা')); // "Dhaka"
console.log('translateBanglaToEnglish("চট্টগ্রাম"):', translateBanglaToEnglish('চট্টগ্রাম')); // "Chattogram"
console.log('translateBanglaToEnglish("Dhaka"):', translateBanglaToEnglish('Dhaka')); // "Dhaka" (unchanged)

console.log('\n=== Testing Institute Prefix Generation ===');
console.log('getInstitutePrefix("ঢাকা জেলা"):', getInstitutePrefix('ঢাকা জেলা')); // "DH" (from Dhaka)
console.log('getInstitutePrefix("চট্টগ্রাম বিভাগ"):', getInstitutePrefix('চট্টগ্রাম বিভাগ')); // "CH" (from Chattogram)
console.log('getInstitutePrefix("Dhaka District"):', getInstitutePrefix('Dhaka District')); // "DH"
console.log('getInstitutePrefix("123 Chittagong Road"):', getInstitutePrefix('123 Chittagong Road')); // "CH"

console.log('\n=== Testing Sample ID Generation ===');
console.log('generateSampleId("SOIL", "ঢাকা জেলা"):', generateSampleId('SOIL', 'ঢাকা জেলা')); // "DH-S{randomNumber}"
console.log('generateSampleId("WATER", "চট্টগ্রাম বিভাগ"):', generateSampleId('WATER', 'চট্টগ্রাম বিভাগ')); // "CH-W{randomNumber}"
console.log('generateSampleId("FERTILIZER", "Sylhet Division"):', generateSampleId('FERTILIZER', 'Sylhet Division')); // "SY-F{randomNumber}"
