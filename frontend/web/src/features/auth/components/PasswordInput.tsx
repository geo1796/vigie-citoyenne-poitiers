// features/auth/components/PasswordInput.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";

type Props = React.ComponentProps<typeof Input> & {
	visible?: boolean;
	onToggleVisibility?: () => void;
};

export function PasswordInput({
	className,
	visible: visibleProp,
	onToggleVisibility,
	...props
}: Props) {
	const [visibleInternal, setVisibleInternal] = useState(false);

	// Contrôlé si le parent fournit `visible`, sinon autonome.
	const isControlled = visibleProp !== undefined;
	const visible = isControlled ? visibleProp : visibleInternal;
	const toggle = isControlled
		? onToggleVisibility
		: () => setVisibleInternal((v) => !v);

	return (
		<div className="relative">
			<Input
				{...props}
				type={visible ? "text" : "password"}
				className={cn("pr-10", className)}
			/>
			<button
				type="button"
				onClick={toggle}
				className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
				aria-label={
					visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
				}
				tabIndex={-1}
			>
				{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
			</button>
		</div>
	);
}
