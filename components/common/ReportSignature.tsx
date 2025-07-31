
import { numberToBangla } from '@/lib/translations';

interface ReportSignatureProps {
  issuedBy?: string
  phone?: string
}
const ReportSignature = ({ issuedBy, phone }: ReportSignatureProps) => {
  return (
    <div className="flex flex-col gap-[1.5px] items-start mt-20 ">
        <p className="text-black"> ({issuedBy}) </p>
        <p className="text-black">প্রধান বৈজ্ঞানিক কর্মকর্তা</p>
        <p className="text-black">সেলফোন: ০{numberToBangla(Number(phone))}</p>
  </div>
  )
}

export default ReportSignature