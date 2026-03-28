import * as Popover from "@radix-ui/react-popover";

const VideoPopover = ({
  trigger,
  videoSrc,
  title,
  description,
  open,
  onOpenChange,
}) => {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-50 w-80 rounded-xl bg-white/5 backdrop-blur-xl border border-white/20 p-0  animate-in fade-in zoom-in duration-200 overflow-hidden"
        >
          <div className="aspect-video w-full bg-black/20">
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 bg-white/5">
            <h3 className="font-bold text-black text-base leading-none mb-1">
              {title}
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              {description}
            </p>
          </div>

          <Popover.Arrow className="fill-white/10" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default VideoPopover;
