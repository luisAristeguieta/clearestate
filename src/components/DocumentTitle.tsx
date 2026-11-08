import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { getViewTitle } from "@/config/brandConfig";

export function DocumentTitle() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    document.title = getViewTitle(pathname);
  }, [pathname]);

  return null;
}