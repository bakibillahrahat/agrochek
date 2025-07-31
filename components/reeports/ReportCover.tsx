'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import ReportHeader from '@/components/common/ReportHeader';
import { useInstitute } from '../frontend-api/institute';
import ReportSignature from '@/components/common/ReportSignature';
import { numberToBangla, numberToBanglaWords, toBanglaNumber } from '@/lib/translations';


interface ReportCoverProps {
  senderAddress: string;
  issueDate: string;
  sarokNo: string;
  senderName: string;
  distributionList?: string[];
  totalSample: number;
  numberOfPages: number;
  sampleTypes: string[];
  clientType?: string;
  detailedPages?: {
    samplePages: number;
    locationPages: number;
    manchitroPages: number;
  } | null;
}

const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return toBanglaNumber(date.toLocaleDateString('bn-BD'))
  }

const ReportCover: React.FC<ReportCoverProps> = ({
  senderAddress,
  senderName,
  issueDate,
  sarokNo,
  totalSample,
  sampleTypes,
  numberOfPages,
  clientType,
  detailedPages,
  distributionList = [
    "১। মহ পরিচালক, মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট, কৃষি খামার সড়ক, ঢাকা-১২১৫।",
    "২। পরিচালক, এনালাইটিক্যাল সার্ভিসেস উইং, মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট, কৃষি খামার সড়ক, ঢাকা-১২১৫।",
    "৩। মূখ্য বৈজ্ঞানিক কর্মকর্তা, মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট, বিভাগীয় গবেষণাগার, দৌলতপুর, খুলনা।",
    "৪। অফিস কপি।"
  ],
  
}) => {
    const { institute } = useInstitute();

    // Function to render attachments based on sample type and client type
    const renderAttachments = () => {
        const isSoil = sampleTypes.includes('SOIL');
        const isGovtOrg = clientType === 'GOVT_ORG';

        if (isSoil && isGovtOrg && detailedPages) {
            return (
                <>
                    <p>১। মৃত্তিকা দলের উপরিস্তরের স্থানভিত্তিক নমুনার রাসায়নিক গুণাবলী -{numberToBangla(detailedPages.samplePages).padStart(2, '০')} ({numberToBanglaWords(detailedPages.samplePages)}) পাতা।</p>
                    <p>২। মৃত্তিকা দলের উপরিস্তরের ভূমি শ্রেণীভিত্তিক গড় রাসায়নিক গুণাবলী -{numberToBangla(detailedPages.locationPages).padStart(2, '০')} ({numberToBanglaWords(detailedPages.locationPages)}) পাতা।</p>
                    <p>৩। মানচিত্র একক হিসাবে গড় রাসায়নিক গুণাবলী -{numberToBangla(detailedPages.manchitroPages).padStart(2, '০')} ({numberToBanglaWords(detailedPages.manchitroPages)}) পাতা।</p>
                </>
            );
        } else {
            // Default attachments for other cases
            return (
                <>
                    <p>১। ফলাফল প্রতিবেদন - {numberToBangla(numberOfPages)} ({numberToBanglaWords(numberOfPages)}) কপি।</p>
                    <p>২। বিল-০১ (এক) কপি।</p>
                    {isSoil && <p>৩। সার সুপারিশ কার্ড-{"০৩(তিন)"} টি।</p>}
                </>
            );
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <Card className="w-[210mm] min-h-[297mm] mx-auto font-bangla bg-white shadow-lg pt-24 px-6">
            <CardHeader className="text-center px-8">
                <ReportHeader instituteName={institute?.name} instituteAddress={institute?.address} />
                <div className="flex justify-between mt-4">
                <div className="space-y-1 w-full">
                    <div className="flex justify-between mb-4">
                        <p className="text-sm font-medium text-black">নং: {"১২,০৩,৪০৪২,০৭১,৫৭,২০১,২০"}</p>
                        <p className="text-sm font-medium text-black">তারিখঃ {formatDate(issueDate)} খ্রি: !</p>
                    </div>
                    <div className="flex flex-col gap-4 items-start">
                        <div className='flex gap-2 w-[35%]'>
                            <div className="text-sm font-medium text-black">প্রাপকঃ </div>
                            <div className="flex flex-col gap-2 items-start">
                                <p className="text-sm font-medium text-black">{senderName},</p>
                                <p className="text-sm font-medium text-black left-0 text-left">{senderAddress}</p>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-black"> বিষয়ঃ {sampleTypes.includes('FERTILIZER') ? 'সার' : sampleTypes.includes('SOIL') ? 'মৃত্তিকা' : sampleTypes.includes('WATER') ? 'পানি' : sampleTypes.map(type => type).join(', ')} পরীক্ষার ফলাফল ও বিল প্রেরণ প্রসংগে।</p>

                        <p className="text-sm font-medium text-black">সূত্রঃ স্মারক নং- {sarokNo}; তারিখঃ {formatDate(issueDate)} খ্রি: !</p>
                    </div>
        
                </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8">
                <div className="text-black">
                    <p className='text-justify'>&nbsp;&nbsp;&nbsp;&nbsp; উপুর্যুক্ত বিষয় ও সূত্রের আলোকে জানানো যাচ্ছে যে, আপনার প্রেরিত {numberToBangla(totalSample)}টি {sampleTypes.includes('FERTILIZER') ? 'বিভিন্ন প্রকার সার' : sampleTypes.includes('SOIL') ? 'মৃত্তিকা' : sampleTypes.includes('WATER') ? 'পানি' : sampleTypes.map(type => type).join(', ')} নমুনার রাসায়নিক বিশ্লেষণী ফলাফল ও বিশ্লেষিনী ফি এর বিল এতদসংঘে সংযুক্ত করে আপনার বরাবর প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য প্রেরণ করা হলো।  উল্লেখ্য, সার নমুনা পরীক্ষার বিশ্লেষণী ফি বিষয়ক তথ্য মৃত্তিকা সম্পদ উন্নয়ন  ইনস্টিটউ , আঞ্চলিক গবেষণাগার, যশোর  এর ওয়েব পোর্টাল (http://srdilabjessore.gov.bd)-এ পাওয়া যাবে।</p>
                </div>
                <div className="flex gap-2">
                    <div>সংযুক্তিঃ</div> 
                    <div className='flex flex-col'>
                        {renderAttachments()}
                    </div>
                </div>
                <div className="flex flex-col gap-[1.5px] items-end -mt-20">
                    <ReportSignature issuedBy={institute?.issuedby} phone={institute?.phone} />
                </div>
                <div className="mt-2">
                <div>সকল অনুলিপি প্রেরণ করা হলো:</div>
                    <ul className='text-md'>
                        {distributionList.map((item, idx) => (
                        <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-col gap-[1.5px] items-end -mt-10">
                    <ReportSignature issuedBy={institute?.issuedby} phone={institute?.phone} />
                </div>
            </CardContent>
            </Card>
        </div>
    );
}

export default ReportCover
