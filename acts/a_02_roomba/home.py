import solara


@solara.component
def Page():
    return solara.Column([
        # Header Section
        solara.HTML(
            "div",
            unsafe_innerHTML="""
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 3rem 2rem;
                border-radius: 12px;
                margin-bottom: 2rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
            ">
                <h1 style="color: white; font-size: 2.5rem; margin: 0 0 1rem 0; font-weight: 700;">
                    🤖 Roomba Cleaning Robot Simulations
                </h1>
                <p style="color: rgba(255,255,255,0.95); font-size: 1.2rem; margin: 0; max-width: 800px; margin: 0 auto;">
                    Agent-Based Modeling with Mesa Framework
                </p>
            </div>
            """,
        ),

        # Introduction Section
        solara.Card(
            children=[
                solara.Markdown("""
                ### 📖 About This Project
                
                This project demonstrates intelligent autonomous cleaning robots (Roombas) using **Agent-Based Modeling (ABM)** 
                powered by the Mesa framework. Explore how multiple robots coordinate, navigate spaces, and optimize 
                cleaning patterns through emergent behaviors.
                
                **Key Features:**
                - Multi-agent coordination and pathfinding
                - Real-time visualization of cleaning progress
                - Customizable parameters for different scenarios
                - Performance metrics and analytics
                """),
            ],
            style={"margin-bottom": "2rem", "padding": "1.5rem"},
        ),

        # Simulations Section
        solara.Markdown("### 🚀 Available Simulations"),

        # Simulation Cards
        solara.Div(
            style={"display": "grid", "grid-template-columns": "repeat(auto-fit, minmax(300px, 1fr))", "gap": "1.5rem",
                   "margin-top": "1rem"},
            children=[
                # Simulation 1 Card
                solara.Card(
                    children=[
                        solara.HTML(
                            "div",
                            unsafe_innerHTML="""
                            <div style="padding: 1rem;">
                                <h3 style="color: #667eea; margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-size: 2rem;">🏠</span>
                                    <span>Simulation 1: Basic Cleaning</span>
                                </h3>
                                <p style="color: #666; line-height: 1.6;">
                                    Explore fundamental Roomba behavior with basic obstacle avoidance and 
                                    systematic cleaning patterns. Perfect for understanding core concepts.
                                </p>
                                <ul style="color: #666; line-height: 1.8;">
                                    <li>Single or multiple robots</li>
                                    <li>Basic navigation algorithms</li>
                                    <li>Coverage optimization</li>
                                    <li>Real-time metrics</li>
                                </ul>
                            </div>
                            """,
                        ),
                        solara.HTML(
                            "div",
                            unsafe_innerHTML="""
                            <a href="/simulation_1" style="
                                display: block;
                                width: 100%;
                                padding: 0.75rem 1.5rem;
                                margin-top: 1rem;
                                background: #667eea;
                                color: white;
                                text-align: center;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: 600;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">
                                Launch Simulation 1 →
                            </a>
                            """,
                        ),
                    ],
                    style={
                        "border": "2px solid #e0e0e0",
                        "border-radius": "8px",
                        "transition": "all 0.3s ease",
                        "cursor": "pointer",
                    },
                ),

                # Simulation 2 Card
                solara.Card(
                    children=[
                        solara.HTML(
                            "div",
                            unsafe_innerHTML="""
                            <div style="padding: 1rem;">
                                <h3 style="color: #764ba2; margin-top: 0; display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-size: 2rem;">🏢</span>
                                    <span>Simulation 2: Advanced Cleaning</span>
                                </h3>
                                <p style="color: #666; line-height: 1.6;">
                                    Advanced multi-robot coordination with complex environments, charging stations, 
                                    and intelligent task allocation strategies.
                                </p>
                                <ul style="color: #666; line-height: 1.8;">
                                    <li>Multi-agent coordination</li>
                                    <li>Dynamic obstacle handling</li>
                                    <li>Battery management</li>
                                    <li>Advanced pathfinding</li>
                                </ul>
                            </div>
                            """,
                        ),
                        solara.HTML(
                            "div",
                            unsafe_innerHTML="""
                            <a href="/simulation_2" style="
                                display: block;
                                width: 100%;
                                padding: 0.75rem 1.5rem;
                                margin-top: 1rem;
                                background: #764ba2;
                                color: white;
                                text-align: center;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: 600;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#5e3c82'" onmouseout="this.style.background='#764ba2'">
                                Launch Simulation 2 →
                            </a>
                            """,
                        ),
                    ],
                    style={
                        "border": "2px solid #e0e0e0",
                        "border-radius": "8px",
                        "transition": "all 0.3s ease",
                        "cursor": "pointer",
                    },
                ),
            ],
        ),

        # Footer Section
        solara.Card(
            children=[
                solara.Markdown("""
                ### 💡 Technologies Used
                
                - **Mesa**: Agent-Based Modeling framework in Python
                - **Solara**: Reactive web framework for Python
                - **Python**: Core programming language
                
                ---
                
                *Built for TC2008B - Modeling of Multi-Agent Systems*
                """),
            ],
            style={"margin-top": "2rem", "padding": "1.5rem", "background-color": "#f8f9fa"},
        ),
    ], style={"max-width": "1200px", "margin": "0 auto", "padding": "2rem"})
