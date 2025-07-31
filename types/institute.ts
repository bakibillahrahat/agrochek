export interface Institute {
  prapok: string;
  name: string;
  address: string;
  issuedby: string;
  phone: string;
}

export interface InstituteFormProps {
  className?: string;
  onSuccess?: () => void;
} 