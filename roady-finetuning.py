# ============================================
# ROADY CONSTRUCTION - FINE-TUNING LLM
# ============================================
# Pipeline complet pour entraîner un modèle spécialisé construction
# Compatible: OpenAI Fine-tuning, Claude (via prompts), Llama, Mistral

"""
Structure:
├── fine_tuning/
│   ├── data/
│   │   ├── raw/                    # Données brutes
│   │   ├── processed/              # Données formatées
│   │   └── validation/             # Données de test
│   ├── prompts/
│   │   ├── system_prompts.py       # Prompts système
│   │   └── few_shot_examples.py    # Exemples few-shot
│   ├── training/
│   │   ├── openai_finetune.py      # Fine-tuning OpenAI
│   │   ├── local_finetune.py       # Fine-tuning local (LoRA)
│   │   └── evaluation.py           # Évaluation des modèles
│   └── deployment/
│       └── model_router.py         # Routing vers le bon modèle
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import hashlib

# ============================================
# fine_tuning/data/data_collector.py
# ============================================

@dataclass
class TrainingExample:
    """Structure pour un exemple d'entraînement."""
    system: str
    user: str
    assistant: str
    category: str
    subcategory: str
    difficulty: str  # basic, intermediate, advanced
    source: str
    metadata: Dict[str, Any]
    
    def to_openai_format(self) -> Dict:
        """Format pour OpenAI fine-tuning."""
        return {
            "messages": [
                {"role": "system", "content": self.system},
                {"role": "user", "content": self.user},
                {"role": "assistant", "content": self.assistant}
            ]
        }
    
    def to_alpaca_format(self) -> Dict:
        """Format Alpaca pour fine-tuning local."""
        return {
            "instruction": self.user,
            "input": "",
            "output": self.assistant,
            "system": self.system
        }


class ConstructionDataCollector:
    """Collecteur de données pour le fine-tuning construction."""
    
    CATEGORIES = {
        "estimation": [
            "cost_estimation", "material_takeoff", "labor_hours",
            "equipment_costs", "overhead_calculation", "contingency"
        ],
        "structural": [
            "load_calculation", "beam_design", "column_design",
            "foundation_design", "connection_design", "seismic_analysis"
        ],
        "codes_standards": [
            "building_code_cnb", "csa_standards", "fire_safety",
            "accessibility", "energy_code", "quebec_regulations"
        ],
        "project_management": [
            "scheduling", "resource_allocation", "risk_management",
            "change_orders", "progress_tracking", "reporting"
        ],
        "materials": [
            "concrete", "steel", "wood", "masonry",
            "insulation", "roofing", "finishes"
        ],
        "mep": [
            "hvac_design", "electrical", "plumbing",
            "fire_protection", "energy_efficiency"
        ],
        "site_work": [
            "excavation", "grading", "drainage",
            "utilities", "landscaping"
        ],
        "safety": [
            "fall_protection", "hazard_identification",
            "ppe_requirements", "safety_plans", "cnesst"
        ]
    }
    
    def __init__(self, output_dir: str = "./fine_tuning/data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.examples: List[TrainingExample] = []
    
    def add_example(self, example: TrainingExample) -> None:
        """Ajouter un exemple avec validation."""
        if not self._validate_example(example):
            raise ValueError(f"Invalid example: {example}")
        self.examples.append(example)
    
    def _validate_example(self, ex: TrainingExample) -> bool:
        """Valider un exemple."""
        if not ex.user or not ex.assistant:
            return False
        if ex.category not in self.CATEGORIES:
            return False
        if ex.subcategory not in self.CATEGORIES.get(ex.category, []):
            return False
        if len(ex.assistant) < 50:  # Réponse trop courte
            return False
        return True
    
    def generate_from_templates(self) -> None:
        """Générer des exemples à partir de templates."""
        templates = self._load_templates()
        
        for template in templates:
            for variation in self._generate_variations(template):
                self.add_example(variation)
    
    def export_dataset(self, format: str = "openai") -> Path:
        """Exporter le dataset."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format == "openai":
            output_path = self.output_dir / f"training_openai_{timestamp}.jsonl"
            with open(output_path, 'w', encoding='utf-8') as f:
                for ex in self.examples:
                    f.write(json.dumps(ex.to_openai_format(), ensure_ascii=False) + '\n')
        
        elif format == "alpaca":
            output_path = self.output_dir / f"training_alpaca_{timestamp}.json"
            data = [ex.to_alpaca_format() for ex in self.examples]
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        
        return output_path
    
    def _load_templates(self) -> List[Dict]:
        """Charger les templates de questions/réponses."""
        return CONSTRUCTION_TEMPLATES
    
    def _generate_variations(self, template: Dict) -> List[TrainingExample]:
        """Générer des variations d'un template."""
        variations = []
        base_values = template.get("variations", [{}])
        
        for values in base_values:
            user = template["user_template"].format(**values)
            assistant = template["assistant_template"].format(**values)
            
            variations.append(TrainingExample(
                system=CONSTRUCTION_SYSTEM_PROMPT,
                user=user,
                assistant=assistant,
                category=template["category"],
                subcategory=template["subcategory"],
                difficulty=template.get("difficulty", "intermediate"),
                source="template_generation",
                metadata={"template_id": template.get("id"), "values": values}
            ))
        
        return variations


# ============================================
# fine_tuning/prompts/system_prompts.py
# ============================================

CONSTRUCTION_SYSTEM_PROMPT = """Tu es ROADY, un assistant IA expert en construction au Québec et au Canada. 

## Expertise
- Estimation de coûts et soumissions
- Calculs structuraux (béton, acier, bois) selon CSA
- Code National du Bâtiment (CNB) et règlements québécois
- Gestion de projets de construction
- Santé et sécurité (CNESST)
- Normes environnementales et LEED

## Comportement
- Fournis des réponses précises avec les normes applicables
- Cite les codes et standards pertinents (CNB, CSA A23.3, CSA S16, etc.)
- Utilise le système métrique (SI)
- Prends en compte le climat québécois (gel, neige, verglas)
- Mentionne les permis et inspections requis quand pertinent

## Format des réponses
- Structure claire avec sections si nécessaire
- Calculs détaillés avec formules
- Avertissements de sécurité quand approprié
- Recommandations de professionnels (ingénieur, architecte) si requis"""

ESTIMATION_SYSTEM_PROMPT = """Tu es un estimateur en construction senior avec 20+ ans d'expérience au Québec.

## Spécialités
- Estimation détaillée et paramétrique
- Analyse des coûts unitaires
- Takeoff de matériaux
- Estimation des heures de main-d'œuvre
- Calcul des frais généraux et profit

## Base de données de coûts
- Coûts moyens Québec 2024
- Ajustements régionaux (Montréal, Québec, régions)
- Facteurs saisonniers
- Indices d'inflation construction

## Format des estimations
- Détail par division CSI/Uniformat
- Coûts unitaires avec quantités
- Contingences appropriées (5-15%)
- Exclusions clairement identifiées"""

STRUCTURAL_SYSTEM_PROMPT = """Tu es un ingénieur en structure spécialisé dans la conception selon les normes canadiennes.

## Normes maîtrisées
- CSA A23.3 - Béton armé
- CSA S16 - Acier de charpente
- CSA O86 - Bois et construction en bois
- CNB 2020 - Charges et combinaisons
- CNBC - Conception parasismique

## Calculs fournis
- Dimensionnement préliminaire
- Vérifications de capacité
- Facteurs de sécurité
- Déformations et flèches

## Avertissements standards
- Toujours recommander validation par ingénieur
- Mentionner les hypothèses simplificatrices
- Identifier les limites des calculs préliminaires"""


# ============================================
# fine_tuning/data/templates.py - Training Templates
# ============================================

CONSTRUCTION_TEMPLATES = [
    # === ESTIMATION ===
    {
        "id": "est_001",
        "category": "estimation",
        "subcategory": "cost_estimation",
        "difficulty": "intermediate",
        "user_template": "Estime le coût d'une dalle de béton de {surface}m² avec une épaisseur de {epaisseur}mm.",
        "assistant_template": """## Estimation - Dalle de béton {surface}m² x {epaisseur}mm

### 1. Calcul du volume
- Surface: {surface} m²
- Épaisseur: {epaisseur} mm = {epaisseur_m} m
- Volume net: {surface} × {epaisseur_m} = {volume} m³
- Facteur de perte (5%): {volume_total} m³

### 2. Matériaux
| Item | Quantité | Prix unitaire | Total |
|------|----------|---------------|-------|
| Béton 30 MPa | {volume_total} m³ | 185$/m³ | {cout_beton}$ |
| Armature 15M @ 300mm | {surface} m² | 12$/m² | {cout_armature}$ |
| Membrane poly | {surface} m² | 2$/m² | {cout_membrane}$ |
| Joints/accessoires | forfait | - | {cout_access}$ |

### 3. Main-d'œuvre
| Tâche | Heures | Taux | Total |
|-------|--------|------|-------|
| Coffrage périmètre | {h_coffrage}h | 65$/h | {cout_coffrage}$ |
| Pose armature | {h_armature}h | 60$/h | {cout_pose_arm}$ |
| Coulée et finition | {h_coulee}h | 65$/h | {cout_coulee}$ |

### 4. Sommaire
- Matériaux: {total_mat}$
- Main-d'œuvre: {total_mo}$
- **Sous-total**: {sous_total}$
- Contingence (10%): {contingence}$
- **TOTAL**: {total}$

*Note: Prix région de Montréal, Q4 2024. Exclut excavation et préparation du sol.*""",
        "variations": [
            {"surface": 50, "epaisseur": 100, "epaisseur_m": 0.1, "volume": 5.0, "volume_total": 5.25,
             "cout_beton": 971, "cout_armature": 600, "cout_membrane": 100, "cout_access": 150,
             "h_coffrage": 4, "h_armature": 3, "h_coulee": 6, "cout_coffrage": 260, "cout_pose_arm": 180,
             "cout_coulee": 390, "total_mat": 1821, "total_mo": 830, "sous_total": 2651, 
             "contingence": 265, "total": 2916},
            {"surface": 100, "epaisseur": 150, "epaisseur_m": 0.15, "volume": 15.0, "volume_total": 15.75,
             "cout_beton": 2914, "cout_armature": 1200, "cout_membrane": 200, "cout_access": 250,
             "h_coffrage": 6, "h_armature": 6, "h_coulee": 10, "cout_coffrage": 390, "cout_pose_arm": 360,
             "cout_coulee": 650, "total_mat": 4564, "total_mo": 1400, "sous_total": 5964,
             "contingence": 596, "total": 6560},
        ]
    },
    
    # === STRUCTURAL ===
    {
        "id": "str_001",
        "category": "structural",
        "subcategory": "beam_design",
        "difficulty": "advanced",
        "user_template": "Dimensionne une poutre d'acier pour une portée de {portee}m avec une charge {charge_type} de {charge}kN/m.",
        "assistant_template": """## Dimensionnement préliminaire - Poutre acier

### Données
- Portée: L = {portee} m
- Charge {charge_type}: w = {charge} kN/m
- Acier: {grade} (Fy = {fy} MPa)

### 1. Sollicitations (poutre simple)
- Moment max: Mf = wL²/8 = {charge} × {portee}² / 8 = **{moment} kN·m**
- Cisaillement max: Vf = wL/2 = {charge} × {portee} / 2 = **{cisaillement} kN**

### 2. Module de section requis
Selon CSA S16-19, avec φ = 0.9:
- Zx requis = Mf / (φ × Fy) = {moment} × 10⁶ / (0.9 × {fy})
- Zx requis = **{zx_requis} × 10³ mm³**

### 3. Sélection de la section
| Section | Zx (×10³ mm³) | Ix (×10⁶ mm⁴) | Masse (kg/m) |
|---------|---------------|----------------|--------------|
| {section_1} | {zx_1} | {ix_1} | {masse_1} |
| **{section_sel}** | **{zx_sel}** | **{ix_sel}** | **{masse_sel}** |
| {section_3} | {zx_3} | {ix_3} | {masse_3} |

**Section recommandée: {section_sel}**

### 4. Vérifications
#### Moment résistant
- Mr = φ × Zx × Fy = 0.9 × {zx_sel} × 10³ × {fy} = {mr} kN·m
- Mr/Mf = {ratio_m} > 1.0 ✓

#### Cisaillement
- Vr = φ × 0.66 × Fy × Aw = {vr} kN
- Vr/Vf = {ratio_v} > 1.0 ✓

#### Flèche (L/360 pour plancher)
- Δmax = 5wL⁴/(384EI) = {fleche} mm
- L/360 = {limite_fleche} mm
- {verdict_fleche}

### 5. Recommandation
**{section_sel}** convient pour cette application.

⚠️ *Calcul préliminaire - À valider par un ingénieur pour le déversement latéral et les connexions.*""",
        "variations": [
            {"portee": 6, "charge_type": "uniformément répartie", "charge": 25, "grade": "350W", "fy": 350,
             "moment": 112.5, "cisaillement": 75, "zx_requis": 357,
             "section_1": "W310x33", "zx_1": 415, "ix_1": 65, "masse_1": 33,
             "section_sel": "W310x39", "zx_sel": 549, "ix_sel": 85, "masse_sel": 39,
             "section_3": "W360x33", "zx_3": 474, "ix_3": 82, "masse_3": 33,
             "mr": 173, "ratio_m": 1.54, "vr": 285, "ratio_v": 3.8,
             "fleche": 12.5, "limite_fleche": 16.7, "verdict_fleche": "Δ < L/360 ✓"},
        ]
    },
    
    # === CODES ET NORMES ===
    {
        "id": "code_001",
        "category": "codes_standards",
        "subcategory": "building_code_cnb",
        "difficulty": "intermediate",
        "user_template": "Quelles sont les exigences de résistance au feu pour un bâtiment {usage} de {etages} étages au Québec?",
        "assistant_template": """## Exigences de résistance au feu - CNB 2020

### Classification du bâtiment
- Usage: {usage} (Groupe {groupe})
- Hauteur: {etages} étages ({hauteur}m)
- Aire de bâtiment estimée: {aire}m²

### 1. Type de construction requis (CNB 3.2.2)
Selon le tableau 3.2.2.20 à 3.2.2.{table}:
- **Type de construction**: {type_construction}
- Gicleurs requis: {gicleurs}

### 2. Degrés de résistance au feu (DRF)
| Élément | DRF requis | Notes |
|---------|------------|-------|
| Structure portante | {drf_structure}h | {note_structure} |
| Planchers | {drf_plancher}h | Séparation coupe-feu |
| Toiture | {drf_toit}h | {note_toit} |
| Murs porteurs | {drf_mur}h | |
| Colonnes | {drf_colonne}h | |

### 3. Séparations coupe-feu
| Type | DRF | Référence CNB |
|------|-----|---------------|
| Entre logements | {scf_logements}h | 3.3.4.2 |
| Corridor | {scf_corridor}h | 3.3.4.4 |
| Escalier | {scf_escalier}h | 3.4.4.1 |
| Vide technique | {scf_vide}h | 3.6.4.2 |

### 4. Issues et évacuation
- Nombre d'issues min: {nb_issues}
- Distance max de parcours: {distance_max}m
- Largeur min escalier: {largeur_escalier}mm

### 5. Références
- CNB 2020 - Partie 3
- Code de construction du Québec, Chapitre I
- Directive RBQ applicable

⚠️ *Consulter un professionnel pour l'analyse complète selon les conditions spécifiques du projet.*""",
        "variations": [
            {"usage": "résidentiel multi-logements", "etages": 4, "groupe": "C", "hauteur": 12,
             "aire": 800, "table": "24", "type_construction": "Combustible (légère)", 
             "gicleurs": "Oui (NFPA 13R)", "drf_structure": 1, "note_structure": "Avec gicleurs",
             "drf_plancher": 1, "drf_toit": 0, "note_toit": "Si non accessible", 
             "drf_mur": 1, "drf_colonne": 1, "scf_logements": 1, "scf_corridor": 1,
             "scf_escalier": 1, "scf_vide": 1, "nb_issues": 2, "distance_max": 45,
             "largeur_escalier": 900},
        ]
    },
    
    # === SAFETY ===
    {
        "id": "safe_001",
        "category": "safety",
        "subcategory": "fall_protection",
        "difficulty": "basic",
        "user_template": "Quelles sont les exigences de protection contre les chutes pour des travaux à {hauteur}m de hauteur?",
        "assistant_template": """## Protection contre les chutes - CNESST

### Contexte
- Hauteur de travail: {hauteur}m
- Seuil d'intervention: 3m (RSST art. 324)

### 1. Exigences applicables
{exigences}

### 2. Méthodes de protection (par ordre de priorité)

#### A) Élimination du risque
- Travail au sol si possible
- Préfabrication en atelier

#### B) Protection collective (prioritaire)
| Équipement | Spécifications | Norme |
|------------|----------------|-------|
| {protection_collective} |

#### C) Protection individuelle
| ÉPI | Spécifications | Norme |
|-----|----------------|-------|
| {protection_individuelle} |

### 3. Plan de travail requis
{plan_requis}

### 4. Formation obligatoire
- {formations}

### 5. Documentation requise
- Programme de prévention (>20 travailleurs)
- Procédure de sauvetage
- Registre d'inspection des équipements
- Fiches de vérification quotidienne

### Références
- RSST, Section XXI - Travail en hauteur
- CSA Z259.16 - Conception des systèmes de protection contre les chutes
- Guide CNESST - Travail en hauteur

⚠️ **Un travailleur ne peut jamais travailler seul en hauteur sans protection adéquate.**""",
        "variations": [
            {"hauteur": 5, 
             "exigences": "- Protection obligatoire (>3m)\n- Garde-corps OU harnais requis\n- Inspection quotidienne des équipements",
             "protection_collective": "Garde-corps | Lisse sup. 1000-1200mm, intermédiaire, plinthe 100mm | CSA Z259.14",
             "protection_individuelle": "Harnais intégral | Classe A (arrêt de chute) | CSA Z259.10\nLonge absorbeur | Max 1.8m avec absorbeur | CSA Z259.11\nPoint d'ancrage | 22 kN minimum | CSA Z259.15",
             "plan_requis": "Oui - Plan de protection contre les chutes écrit requis pour travaux >3m",
             "formations": "- Travail en hauteur (obligatoire)\n- Utilisation du harnais et inspection\n- Procédure de sauvetage"},
        ]
    },
]


# ============================================
# fine_tuning/training/openai_finetune.py
# ============================================

from openai import OpenAI
import time

class OpenAIFineTuner:
    """Fine-tuning avec OpenAI API."""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    def upload_training_file(self, file_path: str) -> str:
        """Upload du fichier de training."""
        with open(file_path, 'rb') as f:
            response = self.client.files.create(file=f, purpose='fine-tune')
        return response.id
    
    def create_fine_tune_job(
        self,
        training_file_id: str,
        model: str = "gpt-4o-mini-2024-07-18",
        suffix: str = "roady-construction",
        n_epochs: int = 3,
        learning_rate_multiplier: float = 1.0
    ) -> str:
        """Créer un job de fine-tuning."""
        response = self.client.fine_tuning.jobs.create(
            training_file=training_file_id,
            model=model,
            suffix=suffix,
            hyperparameters={
                "n_epochs": n_epochs,
                "learning_rate_multiplier": learning_rate_multiplier
            }
        )
        return response.id
    
    def wait_for_completion(self, job_id: str) -> Dict:
        """Attendre la fin du fine-tuning."""
        while True:
            job = self.client.fine_tuning.jobs.retrieve(job_id)
            print(f"Status: {job.status}")
            
            if job.status == "succeeded":
                return {"status": "succeeded", "model": job.fine_tuned_model}
            elif job.status == "failed":
                return {"status": "failed", "error": job.error}
            
            time.sleep(60)
    
    def run_full_pipeline(self, training_file: str) -> str:
        """Pipeline complet de fine-tuning."""
        print("1. Uploading training file...")
        file_id = self.upload_training_file(training_file)
        
        print("2. Creating fine-tune job...")
        job_id = self.create_fine_tune_job(file_id)
        
        print("3. Waiting for completion...")
        result = self.wait_for_completion(job_id)
        
        if result["status"] == "succeeded":
            print(f"✅ Fine-tuning complete! Model: {result['model']}")
            return result["model"]
        else:
            raise Exception(f"Fine-tuning failed: {result['error']}")


# ============================================
# fine_tuning/training/evaluation.py
# ============================================

class ModelEvaluator:
    """Évaluation des modèles fine-tunés."""
    
    def __init__(self, model_id: str, client: OpenAI):
        self.model_id = model_id
        self.client = client
    
    def evaluate(self, test_cases: List[Dict]) -> Dict:
        """Évaluer le modèle sur des cas de test."""
        results = []
        
        for case in test_cases:
            response = self.client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": CONSTRUCTION_SYSTEM_PROMPT},
                    {"role": "user", "content": case["prompt"]}
                ],
                temperature=0.3
            )
            
            answer = response.choices[0].message.content
            score = self._score_response(answer, case["expected_elements"])
            
            results.append({
                "prompt": case["prompt"],
                "response": answer,
                "score": score,
                "category": case["category"]
            })
        
        return self._aggregate_results(results)
    
    def _score_response(self, response: str, expected: List[str]) -> float:
        """Scorer une réponse."""
        response_lower = response.lower()
        found = sum(1 for e in expected if e.lower() in response_lower)
        return found / len(expected) if expected else 0
    
    def _aggregate_results(self, results: List[Dict]) -> Dict:
        """Agréger les résultats."""
        by_category = {}
        for r in results:
            cat = r["category"]
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(r["score"])
        
        return {
            "overall_score": sum(r["score"] for r in results) / len(results),
            "by_category": {k: sum(v)/len(v) for k, v in by_category.items()},
            "total_cases": len(results)
        }


# ============================================
# TEST CASES
# ============================================

EVALUATION_TEST_CASES = [
    {
        "category": "estimation",
        "prompt": "Estime le coût d'un mur de fondation de 20m linéaire, 2.4m de haut en béton armé.",
        "expected_elements": ["béton", "armature", "coffrage", "m³", "$/m", "main-d'œuvre", "total"]
    },
    {
        "category": "structural", 
        "prompt": "Quelle section d'acier W recommandes-tu pour une poutre de 8m avec 30kN/m?",
        "expected_elements": ["moment", "cisaillement", "Zx", "W310", "W360", "flèche", "CSA S16"]
    },
    {
        "category": "codes",
        "prompt": "Résistance au feu requise pour un condo de 6 étages au Québec?",
        "expected_elements": ["CNB", "1h", "2h", "gicleurs", "type de construction", "groupe C"]
    },
    {
        "category": "safety",
        "prompt": "Équipements requis pour travaux sur toiture à 10m?",
        "expected_elements": ["harnais", "garde-corps", "ancrage", "CNESST", "formation", "CSA Z259"]
    }
]
