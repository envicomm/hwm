import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "elevated" | "subtle";
	animate?: boolean;
	animationDelay?: number;
	interactive?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
	(
		{
			className,
			variant = "default",
			animate = false,
			animationDelay,
			interactive = false,
			style,
			...props
		},
		ref,
	) => {
		const variantClasses = {
			default: "glass",
			elevated: "glass-elevated",
			subtle: "glass-subtle",
		};

		return (
			<div
				ref={ref}
				className={cn(
					"rounded-lg p-4",
					variantClasses[variant],
					animate && "animate-fade-in-up",
					interactive && "card-interactive cursor-pointer",
					className,
				)}
				style={{
					...style,
					...(animate && animationDelay
						? { animationDelay: `${animationDelay}s` }
						: {}),
				}}
				{...props}
			/>
		);
	},
);
GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 pb-3", className)}
		{...props}
	/>
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn("text-sm font-medium text-muted-foreground", className)}
		{...props}
	/>
));
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center pt-3", className)}
		{...props}
	/>
));
GlassCardFooter.displayName = "GlassCardFooter";

export {
	GlassCard,
	GlassCardHeader,
	GlassCardTitle,
	GlassCardContent,
	GlassCardFooter,
};
