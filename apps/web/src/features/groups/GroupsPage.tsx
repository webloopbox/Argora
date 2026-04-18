import { Button } from "@heroui/react";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { ui } from "../../texts/ui";

export function GroupsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8 max-w-3xl"
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {ui.groups.pageTitle}
        </h1>
        <p className="mt-3 text-default-600">{ui.groups.pageSubtitle}</p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="flex flex-col items-center rounded-3xl border border-default-100 bg-white/70 px-6 py-16 text-center shadow-sm backdrop-blur"
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-violet-700">
          <Users size={26} />
        </div>
        <h2 className="mt-5 text-lg font-semibold">{ui.groups.emptyTitle}</h2>
        <p className="mt-2 max-w-md text-sm text-default-600">
          {ui.groups.emptyBody}
        </p>
        <Button variant="outline" size="sm" className="mt-6" onPress={() => {}}>
          {ui.common.comingSoon}
        </Button>
      </motion.div>
    </div>
  );
}
