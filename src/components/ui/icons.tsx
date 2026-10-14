import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  );
}

export const ArrowRightIcon = (props: IconProps) => <Icon {...props}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const CheckIcon = (props: IconProps) => <Icon {...props}><path d="m5 12 4 4L19 6" /></Icon>;
export const ChevronDownIcon = (props: IconProps) => <Icon {...props}><path d="m7 10 5 5 5-5" /></Icon>;
export const CloudIcon = (props: IconProps) => <Icon {...props}><path d="M17.5 19H7a5 5 0 1 1 1.4-9.8A6.5 6.5 0 0 1 21 11.5 3.5 3.5 0 0 1 17.5 19Z" /></Icon>;
export const DocumentIcon = (props: IconProps) => <Icon {...props}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 12h5M10 16h5" /></Icon>;
export const LockIcon = (props: IconProps) => <Icon {...props}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>;
export const ScanIcon = (props: IconProps) => <Icon {...props}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" /></Icon>;
export const SparklesIcon = (props: IconProps) => <Icon {...props}><path d="m12 3 1.1 3.1L16 7.5l-2.9 1.4L12 12l-1.1-3.1L8 7.5l2.9-1.4L12 3ZM18.5 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM5.5 12l.8 2.2 2.2.8-2.2.8L5.5 18l-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></Icon>;
export const UploadIcon = (props: IconProps) => <Icon {...props}><path d="M12 16V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></Icon>;
export const UsersIcon = (props: IconProps) => <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>;
export const BuildingIcon = (props: IconProps) => <Icon {...props}><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M18 13h.01M18 17h.01M2 21h20" /></Icon>;
export const HomeIcon = (props: IconProps) => <Icon {...props}><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7" /></Icon>;
