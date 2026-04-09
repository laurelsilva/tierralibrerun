import Image from 'next/image'
import { siteConfig } from '@/lib/config/site'
import  {type SanityImage} from '@/lib/sanity/types'
import '../styles/rainbow-logo.css'

interface CompanyLogoProps {
	logo?: SanityImage
	companyName: string
	width?: number
	height?: number
	className?: string
	variant?: 'default' | 'hero' | 'filter'
	disableTierraLibreOverride?: boolean
}

const TierraLibreLogo = ({
	width = 100,
	height = 100,
	className = ''
}: {
	width?: number
	height?: number
	className?: string
}) => (
	<div className={`rainbow-hover ${className}`} style={{width, height}}>
		<svg
			width={width}
			height={height}
			viewBox="0 0 1094 1093"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="h-full w-full">
			<path
				d="M546.621 1024.09C592.077 1024.09 636.021 1017.57 677.698 1005.66H415.544C457.222 1017.57 501.178 1024.09 546.621 1024.09ZM958.583 787.863C963.775 779.029 968.686 770.014 973.316 760.839H119.939C124.557 770.014 129.468 779.029 134.672 787.863H958.583ZM293.229 951.086H800.014C813.358 942.704 826.239 933.675 838.669 924.05H254.586C267.004 933.675 279.885 942.691 293.229 951.086ZM921.134 842.457H172.109C179.469 851.729 187.086 860.781 195.092 869.48H898.139C906.157 860.781 913.786 851.717 921.134 842.457ZM632.328 532.921L575.04 568.01L486.201 480.91L259.778 651.711H80.7472C84.9515 670.315 90.1916 688.542 96.5164 706.269H996.751C1000.36 696.12 1003.6 685.789 1006.52 675.347H848.845L632.328 532.921ZM991.328 480.045L936.94 513.367L848.71 426.863L729.942 531.776L865.186 620.741H1018.54C1022.33 596.532 1024.33 571.75 1024.33 546.494C1024.33 533.75 1023.68 521.152 1022.71 508.664L991.328 480.045ZM271.501 439.071L324.926 406.346L401.603 476.341L490.869 409.015L582.852 499.222L633.377 468.263L694.504 508.469L850.173 370.953L942.802 461.769L996.215 429.044L1013.28 444.639C966.456 230.087 775.068 68.9103 546.621 68.9103C322.221 68.9103 133.563 224.458 82.5751 433.345L178.884 348.279L271.501 439.071ZM546.621 0C245.215 0 0 245.158 0 546.494C0 847.83 245.215 1093 546.621 1093C848.028 1093 1093.24 847.83 1093.24 546.494C1093.24 245.158 848.028 0 546.621 0ZM102.171 754.017C101.111 751.75 100.099 749.472 99.0755 747.194C95.0418 738.227 91.2153 729.15 87.7178 719.903C86.8526 717.612 85.9629 715.37 85.1343 713.068C84.33 710.814 83.611 708.523 82.8188 706.245C76.6891 688.493 71.5342 670.303 67.4396 651.687C63.5156 633.813 60.4812 615.636 58.5679 597.104C56.8496 580.462 55.96 563.575 55.96 546.482C55.96 534.249 56.5693 522.163 57.4589 510.15C59.0066 489.085 61.7485 468.336 65.8919 448.075C111.579 224.592 309.766 55.9469 546.621 55.9469C787.425 55.9469 988.111 230.306 1029.37 459.333C1033.03 479.643 1035.58 500.33 1036.65 521.408C1037.08 529.729 1037.3 538.087 1037.3 546.506C1037.3 571.738 1035.37 596.532 1031.68 620.753C1028.85 639.308 1024.85 657.498 1020 675.335C1017.16 685.776 1013.95 696.084 1010.44 706.257C1009.66 708.535 1008.95 710.826 1008.12 713.08C1007.29 715.37 1006.4 717.624 1005.54 719.915C1002.03 729.162 998.213 738.239 994.18 747.206C993.144 749.484 992.145 751.763 991.072 754.029C990.024 756.319 988.988 758.598 987.879 760.864C983.407 770.05 978.557 779.029 973.524 787.887C972.232 790.177 970.928 792.456 969.6 794.722C968.271 796.988 966.992 799.291 965.615 801.545C959.911 810.877 953.818 819.93 947.542 828.824C945.921 831.114 944.325 833.393 942.692 835.659C940.998 837.949 939.341 840.228 937.635 842.494C930.579 851.778 923.157 860.757 915.492 869.517C913.506 871.795 911.592 874.122 909.569 876.34C907.449 878.667 905.231 880.884 903.074 883.175C894.154 892.592 884.941 901.755 875.301 910.466C872.73 912.781 870.049 915.01 867.429 917.289C864.809 919.567 862.225 921.894 859.556 924.111C848.065 933.663 836.085 942.655 823.74 951.147C820.34 953.474 816.88 955.716 813.419 957.982C809.885 960.272 806.387 962.587 802.792 964.792C786.365 974.88 769.279 983.945 751.682 992.083C746.637 994.411 741.604 996.75 736.486 998.918C730.77 1001.31 725.018 1003.55 719.205 1005.74C665.451 1025.89 607.31 1037.05 546.621 1037.05C485.921 1037.05 427.792 1025.89 374.086 1005.66C368.273 1003.46 362.509 1001.23 356.806 998.833C351.675 996.665 346.655 994.338 341.609 991.998C323.988 983.86 306.903 974.795 290.487 964.707C290.487 964.707 283.956 960.211 280.032 957.896H279.861C276.4 955.63 272.951 953.401 269.539 951.061C257.182 942.582 245.227 933.578 233.711 924.026C231.042 921.809 228.459 919.482 225.839 917.203C223.218 914.925 220.537 912.708 217.966 910.38C208.339 901.669 199.126 892.507 190.206 883.089C188.049 880.799 185.831 878.594 183.71 876.254L177.788 869.432C170.11 860.672 162.689 851.692 155.633 842.408C153.939 840.142 152.257 837.864 150.587 835.573C148.93 833.307 147.334 831.029 145.725 828.738C139.437 819.844 133.332 810.78 127.64 801.459C126.263 799.206 124.984 796.903 123.656 794.637C122.315 792.37 121.023 790.092 119.719 787.802C114.686 778.944 109.848 769.965 105.364 760.779L102.171 754.017ZM368.359 501.427L320.064 457.335L265.676 490.669L177.459 404.178L71.4002 497.845C69.7672 513.842 68.9385 530.07 68.9385 546.494C68.9385 563.587 69.8891 580.486 71.6439 597.117H241.522L368.359 501.427Z"
				fill="currentColor"
				className="rainbow-path"
			/>
		</svg>
	</div>
)

export default function CompanyLogo({
	logo,
	companyName,
	width = 100,
	height = 100,
	className = '',
	variant = 'default',
	disableTierraLibreOverride = false
}: CompanyLogoProps) {
	// Always use the SVG logo for the site's own organization unless disabled
	if (
		!disableTierraLibreOverride &&
		companyName.toLowerCase().includes(siteConfig.name.toLowerCase())
	) {
		return (
			<div
				className={`overflow-hidden rounded-lg ${
					variant === 'hero'
						? 'bg-transparent'
						: variant === 'filter'
							? 'bg-transparent'
							: 'border-border bg-card border'
				} ${className}`}>
				<TierraLibreLogo
					width={width}
					height={height}
					className={`${
						variant === 'hero'
							? 'text-white drop-shadow-2xl'
							: variant === 'filter'
								? 'text-foreground'
								: 'text-foreground p-2'
					}`}
				/>
			</div>
		)
	}

	if (!logo?.asset?.url) {
		return (
			<div
				className={`flex items-center justify-center rounded-lg font-medium ${
					variant === 'hero'
						? 'border border-white/30 bg-white/20 text-white backdrop-blur-sm'
						: variant === 'filter'
							? 'bg-muted border-border text-muted-foreground border'
							: 'bg-card border-border text-muted-foreground border'
				} ${className}`}
				style={{width, height}}>
				{companyName.charAt(0).toUpperCase()}
			</div>
		)
	}

	return (
		<div
			className={`overflow-hidden rounded-lg ${
				variant === 'hero'
					? 'bg-transparent'
					: variant === 'filter'
						? 'bg-muted border-border border'
						: 'border-border bg-card border'
			} ${className}`}>
			<Image
				src={`${logo.asset.url}?w=${width * 2}&h=${height * 2}&fit=fill&auto=format`}
				alt={`${companyName} logo`}
				width={width}
				height={height}
				className={`object-contain ${
					variant === 'hero'
						? 'drop-shadow-2xl'
						: variant === 'filter'
							? 'p-1'
							: 'p-2'
				}`}
				priority={variant === 'hero'}
				quality={85}
				placeholder="blur"
				blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjwvc3ZnPg=="
			/>
		</div>
	)
}
