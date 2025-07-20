import { LuDumbbell } from 'react-icons/lu';

interface Props {
	size: number;
}

export const Logo = ({ size }: Props) => {
	return <LuDumbbell size={size} />;
};
