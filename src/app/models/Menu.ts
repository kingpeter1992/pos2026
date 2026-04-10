interface SubMenu {
  id: string;
  titre: string;
  url: string;
  icon: string;
}

interface Menu {
  id: string;
  titre: string;
  icon: string;
  url?: string;
  sousMenus: SubMenu[];
}
